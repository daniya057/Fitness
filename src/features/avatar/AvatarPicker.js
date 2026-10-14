import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { lightTap } from "../../lib/haptics";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { PillButton } from "../../ui/kit";
import { ACHIEVEMENTS, isHidden } from "../achievements/catalog";
import { useAuth } from "../auth/AuthContext";
import { AvatarBadge } from "./AvatarBadge";
import { FACES, RINGS, faceOf, isUnlocked, ringOf } from "./looks";
import { pickAvatarPhoto } from "./pick";

function ChipRow({ items, worn, onPick, kind, user }) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {items.map((item) => {
        const open = isUnlocked(user, item);
        const on = worn === item.id;
        const preview = kind === "face" ? { ...user, avatarFace: item.id } : { ...user, avatarRing: item.id };
        return (
          <Pressable
            key={item.id}
            onPress={() => onPick(item)}
            className="items-center rounded-[22px] px-3 py-3"
            style={glassStyle({
              variant: "fill",
              borderRadius: 22,
              backgroundColor: on ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.06)",
              borderColor: on ? "rgba(155,255,200,0.45)" : undefined,
              opacity: open ? 1 : 0.42,
            })}
          >
            <AvatarBadge user={preview} size="sm" hollow={kind === "ring"} />
            <Text className="mt-2 max-w-[80px] text-center text-[12px] leading-4 text-white/80" numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AvatarPicker({ open, onToggle }) {
  const { user, patch } = useAuth();
  const [localOpen, setLocalOpen] = useState(false);
  const shown = open ?? localOpen;
  const toggle = onToggle || (() => setLocalOpen((value) => !value));
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("face");
  const face = faceOf(user?.avatarFace);
  const ring = ringOf(user?.avatarRing);

  const pick = async (kind, item) => {
    await lightTap();
    if (!isUnlocked(user, item)) {
      const ach = ACHIEVEMENTS.find((row) => row.id === item.need);
      setHint(ach && isHidden(user, ach) ? "Скрытое достижение" : ach?.hint || item.blurb || item.title);
      return;
    }
    setBusy(true);
    setHint(item.blurb || "");
    try {
      if (kind === "face" && item.id === "photo") {
        if (user?.avatarPhoto && user?.avatarFace !== "photo") {
          await patch({ avatarFace: "photo" });
          return;
        }
        const data = await pickAvatarPhoto();
        if (!data) {
          return;
        }
        await patch({ avatarPhoto: data, avatarFace: "photo" });
        return;
      }
      if ((kind === "face" ? user?.avatarFace : user?.avatarRing) === item.id) {
        return;
      }
      await patch(kind === "face" ? { avatarFace: item.id } : { avatarRing: item.id });
    } catch (err) {
      setHint(err.message || "Не наделось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mt-8">
      <Pressable
        onPress={async () => {
          await lightTap();
          if (!shown) {
            setStep("face");
            setHint("");
          }
          toggle();
        }}
        className="mb-3 flex-row items-center justify-between"
      >
        <Text className="text-[12px] font-medium tracking-[1.2px] text-white/55">Значок и окантовка</Text>
        <View className="flex-row items-center" style={{ minHeight: 44 }}>
          <Text className="mr-1 text-[14px] font-medium" style={{ color: getPalette().accent }}>
            {shown ? "Скрыть" : "Выбрать"}
          </Text>
          <ChevronDown
            size={18}
            color="rgba(255,255,255,0.45)"
            strokeWidth={1.8}
            style={{ transform: [{ rotate: shown ? "180deg" : "0deg" }] }}
          />
        </View>
      </Pressable>
      {shown ? (
        <View className="rounded-[28px] px-5 py-5" style={glassStyle({ borderRadius: 28 })}>
          <View className="mb-5 items-center">
            <AvatarBadge user={user} size="lg" />
            <Text className="mt-3 text-[16px] font-semibold text-white">
              {face.title} · {ring.title}
            </Text>
            <Text className="mt-1 text-[12px] text-white/55">
              {step === "face" ? "Шаг 1 из 2 · лицо" : "Шаг 2 из 2 · окантовка"}
            </Text>
            <Text className="mt-1 text-center text-[12px] leading-4 text-white/45">
              {step === "face" ? face.blurb : ring.blurb}
            </Text>
          </View>
          {step === "face" ? (
            <>
              <Text className="mb-3 text-[12px] font-medium tracking-[0.8px] text-white/55">Лицо</Text>
              <ChipRow items={FACES} worn={user?.avatarFace} user={user} kind="face" onPick={(item) => !busy && pick("face", item)} />
              <View className="mt-5">
                <PillButton
                  wide
                  label="Дальше — окантовка"
                  tone="glassOn"
                  onPress={async () => {
                    await lightTap();
                    setHint("");
                    setStep("ring");
                  }}
                />
              </View>
            </>
          ) : (
            <>
              <Text className="mb-3 text-[12px] font-medium tracking-[0.8px] text-white/55">Окантовка</Text>
              <ChipRow items={RINGS} worn={user?.avatarRing} user={user} kind="ring" onPick={(item) => !busy && pick("ring", item)} />
              <View className="mt-5">
                <PillButton
                  wide
                  label="Назад к лицу"
                  tone="fill"
                  onPress={async () => {
                    await lightTap();
                    setHint("");
                    setStep("face");
                  }}
                />
              </View>
            </>
          )}
          {hint ? <Text className="mt-4 text-[13px] leading-5 text-white/55">{hint}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}
