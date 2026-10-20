import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";
import { ctaFill } from "../../ui/cta";
import { GhostButton } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { lightTap } from "../../lib/haptics";
import { useAuth } from "../auth/AuthContext";
import { CountdownRing } from "../arena/CountdownRing";
import { FEEL_OPTIONS } from "../onboarding/quiz";
import { ChoiceRow } from "../onboarding/ChoiceGrid";
import { todayCheckin } from "../checkins/recommend";
import { isHoldMove, isSetSession, isTapSet, levelLabel, minActivitySec, minSets, repsLabel } from "./catalog";
import { lookOfGroup } from "./look";
import { ACCENT_INK } from "../../ui/layout";
import { MoveHintButton, MoveHintModal } from "./MoveHint";
import { PREP_SEC, useSession } from "./sessionStore";
import { loadKg, readLoad, sessionLoadTitles } from "./loads";

function GymLoadField({ title, user, patch }) {
  const saved = loadKg(user?.gymLoads, title);
  const history = readLoad(user?.gymLoads, title).history;
  const initial = saved > 0 ? String(saved) : "";
  const [text, setText] = useState(initial);
  const lastTitle = useRef(title);

  useEffect(() => {
    if (lastTitle.current !== title) {
      lastTitle.current = title;
      const next = loadKg(user?.gymLoads, title);
      setText(next > 0 ? String(next) : "");
    }
  }, [title, user?.gymLoads]);

  const commit = () => {
    const kg = Math.round(Number(String(text).replace(",", ".")) * 10) / 10;
    if (!Number.isFinite(kg) || kg < 0 || kg > 400) {
      return;
    }
    if (kg === saved) {
      return;
    }
    patch({ gymLoad: { title, kg } }).catch(() => {});
  };

  const past = history.filter((kg) => Number(kg) > 0).slice(-3);

  return (
    <View className="mt-4 w-full max-w-[220px] self-center">
      <Text className="mb-2 text-center text-[12px] text-white/45">Вес, кг — запомнится</Text>
      <TextInput
        className="rounded-2xl px-4 text-center text-[18px] font-semibold text-white"
        placeholder="0"
        placeholderTextColor="#8A8A8A"
        keyboardType="decimal-pad"
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        style={{ ...glassStyle({ variant: "fill", borderRadius: 16 }), minHeight: 48 }}
      />
      {past.length ? (
        <Text className="mt-2 text-center text-[11px] leading-4 text-white/40">Было: {past.join(" → ")} кг</Text>
      ) : null}
    </View>
  );
}

function clock(sec) {
  const n = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionPlayer() {
  const insets = useSafeAreaInsets();
  const { user, patch } = useAuth();
  const session = useSession((s) => s.session);
  const steps = useSession((s) => s.steps);
  const index = useSession((s) => s.index);
  const remaining = useSession((s) => s.remaining);
  const elapsed = useSession((s) => s.elapsed);
  const prep = useSession((s) => s.prep);
  const running = useSession((s) => s.running);
  const finished = useSession((s) => s.finished);
  const play = useSession((s) => s.play);
  const pause = useSession((s) => s.pause);
  const skip = useSession((s) => s.skip);
  const completeWork = useSession((s) => s.completeWork);
  const skipPrep = useSession((s) => s.skipPrep);
  const close = useSession((s) => s.close);
  const tick = useSession((s) => s.tick);
  const workDone = useSession((s) => s.workDone);
  const setsMode = isSetSession(session) || Boolean(session?.custom);
  const need = minActivitySec(session);
  const counted = finished && (setsMode ? (Number(workDone) || 0) >= need : (Number(elapsed) || 0) >= need);
  const feelDone = Boolean(todayCheckin(user)?.feel);
  const [hintTitle, setHintTitle] = useState("");
  const [feel, setFeel] = useState("");
  const [bumped, setBumped] = useState(false);
  const logged = useRef(false);
  const prevIndex = useRef(index);

  const step = steps[index];
  const next = steps[index + 1];
  const rest = step?.kind === "rest";
  const tapSet = isTapSet(step, session);
  const look = lookOfGroup(session?.group);
  const reps = repsLabel(step);

  const hintOpen = Boolean(hintTitle);
  const live = !hintOpen && (prep > 0 || running);

  useEffect(() => {
    if (!live) {
      return undefined;
    }
    const timer = setInterval(() => tick(), 1000);
    return () => clearInterval(timer);
  }, [live, tick]);

  useEffect(() => {
    if (prevIndex.current !== index) {
      prevIndex.current = index;
      lightTap();
    }
  }, [index]);

  const prevPrep = useRef(prep);
  useEffect(() => {
    if (prevPrep.current > 0 && prep === 0) {
      lightTap();
    }
    prevPrep.current = prep;
  }, [prep]);

  useEffect(() => {
    if (!finished || logged.current) {
      return;
    }
    logged.current = true;
    lightTap();
    if (setsMode ? (Number(workDone) || 0) < need : (Number(elapsed) || 0) < need) {
      return;
    }
    const now = new Date();
    patch({
      activityDone: true,
      elapsedSec: Number(elapsed) || 0,
      workSetsDone: Number(workDone) || 0,
      activityKind: session?.kind || "",
      activitySession: session?.id || "",
      activityHour: now.getHours(),
      activityWeekday: now.getDay(),
    }).catch(() => {});
  }, [finished, elapsed, workDone, need, setsMode, patch, session?.kind, session?.id]);

  useEffect(() => {
    logged.current = false;
    prevIndex.current = 0;
    setBumped(false);
  }, [session?.id]);

  if (!session || !step) {
    return null;
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <View className="flex-1 px-6 pb-8">
        <View className="flex-row items-center justify-between pt-2">
          <SoftPress
            onPress={close}
            className="rounded-full px-5"
            style={{ ...glassStyle({ variant: "fill", borderRadius: 999 }), minHeight: 44 }}
          >
            <Text className="text-[14px] font-semibold text-white">Назад</Text>
          </SoftPress>
          <Text className="text-[13px] text-white/55">
            {prep > 0
              ? "Сейчас начнём"
              : step.rounds > 1
                ? `${isSetSession(session) ? "Подход" : "Круг"} ${step.round} из ${step.rounds}`
                : `${index + 1} / ${steps.length}`}
          </Text>
        </View>
        {levelLabel(session.level) ? (
          <Text className="mt-4 text-center text-[15px] font-medium" style={{ color: look.accent }}>
            {levelLabel(session.level)}
          </Text>
        ) : null}

        <View
          className="mt-8 flex-1 items-center justify-center rounded-[32px] px-6 py-10"
          style={glassStyle({
            borderRadius: 32,
            backgroundColor: rest ? "rgba(255,255,255,0.05)" : "rgba(125,255,179,0.08)",
          })}
        >
          {prep > 0 ? (
            <Text className="text-center text-[40px] font-semibold leading-[44px]" style={{ color: look.accent }}>
              Приготовься
            </Text>
          ) : (
            <Text className="text-[13px] font-medium tracking-[1px]" style={{ color: look.accent }}>
              {rest ? "Пауза" : "Движение"}
            </Text>
          )}
          <Text
            className={
              prep > 0
                ? "mt-3 text-center text-[18px] font-medium leading-6 text-white"
                : "mt-3 text-center text-[28px] font-semibold leading-8 text-white"
            }
          >
            {prep > 0 ? session.title : step.title}
          </Text>
          {!prep && reps && !tapSet ? (
            <Text className="mt-2 text-center text-[16px] font-medium" style={{ color: look.accent }}>
              {reps}
            </Text>
          ) : null}
          {prep > 0 && isSetSession(session) ? (
            <Text className="mt-3 text-center text-[14px] leading-5 text-white/55">
              Подходы и повторы, не круги. Вес — тот, с которым последние два чуть тяжёлые.
            </Text>
          ) : null}
          {prep > 0 ? (
            <Text className="mt-3 text-center text-[13px] leading-5 text-white/45">
              {setsMode
                ? `Засчитаем от ${minSets(session)} рабочих подходов. Разминку и дорожку в конце можно пропустить.`
                : "Засчитаем, если сделаешь хотя бы половину упражнений по времени. Паузы не считаются."}
            </Text>
          ) : null}
          {prep > 0 || (!rest && !finished) ? (
            <MoveHintButton title={step.title} onPress={setHintTitle} />
          ) : null}
          {tapSet && !prep ? (
            <View className="mt-8 items-center">
              <Text className="text-center text-[18px] font-medium leading-6 text-white/70">
                {step.rounds > 1 ? `${reps} × подход ${step.round} из ${step.rounds}` : reps || "Сделай подход"}
              </Text>
              <Text className="mt-2 text-center text-[13px] leading-5 text-white/45">Считай сам. Кольцо только на отдыхе.</Text>
            </View>
          ) : (
            <View className="relative mt-8 items-center justify-center" style={{ width: 220, height: 220 }}>
              <CountdownRing
                smooth
                running={live && !finished}
                stepKey={prep > 0 ? "prep" : index}
                totalSec={prep > 0 ? PREP_SEC : step.sec}
                remaining={prep > 0 ? prep : remaining}
                progress={prep > 0 ? prep / PREP_SEC : step.sec > 0 ? remaining / step.sec : 0}
                size={220}
                track={getPalette().track}
                stroke={rest && !prep ? getPalette().faint : look.accent}
              />
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-[64px] font-semibold leading-[68px] tabular-nums text-white">
                  {clock(prep > 0 ? prep : remaining)}
                </Text>
              </View>
            </View>
          )}
          {prep > 0 ? (
            <Text className="mt-6 text-center text-[14px] text-white/55">дальше: {step.title}</Text>
          ) : next ? (
            <Text className="mt-6 text-center text-[14px] text-white/55">дальше: {next.title}</Text>
          ) : (
            <Text className="mt-6 text-center text-[14px] text-white/55">последний блок</Text>
          )}
        </View>
        {!prep && !rest && !finished && isSetSession(session) && !isHoldMove(step.title) && !step.warmup && !step.finisher ? (
          <GymLoadField title={step.title} user={user} patch={patch} />
        ) : null}

        {prep > 0 ? (
          <View className="mt-6">
            <GhostButton glass label="Пропустить подготовку" onPress={skipPrep} />
          </View>
        ) : finished ? (
          <View className="mt-6">
            <Text className="mb-4 text-center text-[18px] font-semibold text-white">
              {counted ? "Готово" : "Мало работы — не засчитано"}
            </Text>
            {counted && isSetSession(session) && !bumped ? (
              <View className="mb-4">
                <SoftPress
                  onPress={() => {
                    setBumped(true);
                    patch({ gymLoadBump: sessionLoadTitles(session) }).catch(() => {});
                  }}
                  className="items-center rounded-full"
                  style={{ ...glassStyle({ variant: "fill", borderRadius: 999 }), minHeight: 48 }}
                >
                  <Text className="text-[15px] font-semibold text-white">В следующий раз +2,5 кг</Text>
                </SoftPress>
              </View>
            ) : null}
            {counted && bumped ? (
              <Text className="mb-4 text-center text-[13px] text-white/55">Веса подняли. В следующий раз подставим новые.</Text>
            ) : null}
            {counted && user?.quizDone && !feelDone ? (
              <View className="mb-4">
                <Text className="mb-2 text-center text-[13px] text-white/55">Как зашло?</Text>
                <ChoiceRow
                  options={FEEL_OPTIONS}
                  value={feel}
                  onChange={(id) => {
                    setFeel(id);
                    patch({ checkinFeel: id }).catch(() => {});
                  }}
                />
              </View>
            ) : null}
            <SoftPress onPress={close} className="w-full items-center rounded-full" style={ctaFill(look.accent)}>
              <Text className="text-[15px] font-semibold" style={{ color: ACCENT_INK }}>
                К списку
              </Text>
            </SoftPress>
          </View>
        ) : (
          <View className="mt-6 flex-row gap-3">
            {tapSet ? (
              <>
                <SoftPress onPress={completeWork} className="flex-1 items-center rounded-full" style={ctaFill(look.accent)}>
                  <Text className="text-[15px] font-semibold" style={{ color: ACCENT_INK }}>
                    Сделал
                  </Text>
                </SoftPress>
                <SoftPress
                  onPress={skip}
                  className="items-center rounded-full px-6"
                  style={{ ...glassStyle({ variant: "fill", borderRadius: 999 }), minHeight: 52 }}
                >
                  <Text className="text-[15px] font-semibold text-white">Пропустил</Text>
                </SoftPress>
              </>
            ) : (
              <>
                <SoftPress
                  onPress={running ? pause : play}
                  className="flex-1 items-center rounded-full"
                  style={ctaFill(look.accent)}
                >
                  <Text className="text-[15px] font-semibold" style={{ color: ACCENT_INK }}>
                    {running ? "Пауза" : "Старт"}
                  </Text>
                </SoftPress>
                <SoftPress
                  onPress={skip}
                  className="items-center rounded-full px-6"
                  style={{ ...glassStyle({ variant: "fill", borderRadius: 999 }), minHeight: 52 }}
                >
                  <Text className="text-[15px] font-semibold text-white">Дальше</Text>
                </SoftPress>
              </>
            )}
          </View>
        )}
      </View>
      <MoveHintModal title={hintTitle} onClose={() => setHintTitle("")} />
    </View>
  );
}
