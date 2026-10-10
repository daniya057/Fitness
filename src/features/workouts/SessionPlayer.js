import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { lightTap } from "../../lib/haptics";
import { useAuth } from "../auth/AuthContext";
import { CountdownRing } from "../arena/CountdownRing";
import { levelLabel, repsLabel } from "./catalog";
import { lookOfGroup } from "./look";
import { MoveHintButton, MoveHintModal } from "./MoveHint";
import { MIN_ACTIVITY_SEC, PREP_SEC, useSession } from "./sessionStore";

function clock(sec) {
  const n = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionPlayer() {
  const insets = useSafeAreaInsets();
  const { patch } = useAuth();
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
  const skipPrep = useSession((s) => s.skipPrep);
  const close = useSession((s) => s.close);
  const tick = useSession((s) => s.tick);
  const [hintTitle, setHintTitle] = useState("");
  const logged = useRef(false);
  const prevIndex = useRef(index);

  const step = steps[index];
  const next = steps[index + 1];
  const rest = step?.kind === "rest";
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
    if ((Number(elapsed) || 0) < MIN_ACTIVITY_SEC) {
      return;
    }
    const now = new Date();
    patch({
      activityDone: true,
      elapsedSec: Number(elapsed) || 0,
      activityKind: session?.kind || "",
      activitySession: session?.id || "",
      activityHour: now.getHours(),
      activityWeekday: now.getDay(),
    }).catch(() => {});
  }, [finished, elapsed, patch, session?.kind, session?.id]);

  useEffect(() => {
    logged.current = false;
    prevIndex.current = 0;
  }, [session?.id]);

  if (!session || !step) {
    return null;
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <View className="flex-1 px-6 pb-8">
        <View className="flex-row items-center justify-between pt-2">
          <SoftPress onPress={close} className="rounded-full px-4 py-2" style={glassStyle({ borderRadius: 999 })}>
            <Text className="text-[14px] font-medium text-white">Назад</Text>
          </SoftPress>
          <Text className="text-[13px] text-white/55">
            {prep > 0
              ? "Сейчас начнём"
              : step.rounds > 1
                ? `Подход ${step.round} из ${step.rounds}`
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
          {!prep && reps ? (
            <Text className="mt-2 text-center text-[16px] font-medium" style={{ color: look.accent }}>
              {reps}
            </Text>
          ) : null}
          {prep > 0 || (!rest && !finished) ? (
            <MoveHintButton title={step.title} onPress={setHintTitle} />
          ) : null}
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
          {prep > 0 ? (
            <Text className="mt-6 text-center text-[14px] text-white/55">дальше: {step.title}</Text>
          ) : next ? (
            <Text className="mt-6 text-center text-[14px] text-white/55">дальше: {next.title}</Text>
          ) : (
            <Text className="mt-6 text-center text-[14px] text-white/55">последний блок</Text>
          )}
        </View>

        {prep > 0 ? (
          <View className="mt-6">
            <SoftPress onPress={skipPrep} className="items-center rounded-full py-4" style={glassStyle({ borderRadius: 999 })}>
              <Text className="text-[15px] font-medium text-white">Пропустить подготовку</Text>
            </SoftPress>
          </View>
        ) : finished ? (
          <View className="mt-6">
            <Text className="mb-4 text-center text-[18px] font-semibold text-white">
              {elapsed >= MIN_ACTIVITY_SEC ? "Готово" : "Меньше минуты — не засчитано"}
            </Text>
            <SoftPress onPress={close} className="items-center rounded-full py-4" style={{ backgroundColor: look.accent }}>
              <Text className="text-[15px] font-semibold text-white">К списку</Text>
            </SoftPress>
          </View>
        ) : (
          <View className="mt-6 flex-row gap-3">
            <SoftPress
              onPress={running ? pause : play}
              className="flex-1 items-center rounded-full py-4"
              style={{ backgroundColor: look.accent }}
            >
              <Text className="text-[15px] font-semibold text-white">{running ? "Пауза" : "Старт"}</Text>
            </SoftPress>
            <SoftPress onPress={skip} className="items-center rounded-full px-6 py-4" style={glassStyle({ borderRadius: 999 })}>
              <Text className="text-[15px] font-medium text-white">Дальше</Text>
            </SoftPress>
          </View>
        )}
      </View>
      <MoveHintModal title={hintTitle} onClose={() => setHintTitle("")} />
    </View>
  );
}
