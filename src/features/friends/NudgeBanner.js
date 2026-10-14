import { Text } from "react-native";
import { useRouter } from "expo-router";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { useAuth } from "../auth/AuthContext";

export function NudgeBanner() {
  const { user, ackNudges } = useAuth();
  const router = useRouter();
  const items = Array.isArray(user?.incomingNudges) ? user.incomingNudges : [];
  const latest = items[items.length - 1];

  if (!latest) {
    return null;
  }

  return (
    <SoftPress
      onPress={() => {
        ackNudges().catch(() => {});
        router.replace("/workouts");
      }}
      className="mb-3 rounded-[24px] px-5"
      style={{
        ...glassStyle({
          borderRadius: 24,
          backgroundColor: "rgba(125,255,179,0.16)",
        }),
        minHeight: 64,
        alignItems: "flex-start",
        paddingVertical: 16,
      }}
    >
      <Text className="text-[16px] font-semibold text-white">{latest.fromName} позвал на тренировку</Text>
      <Text className="mt-1 text-[13px]" style={{ color: getPalette().accent }}>
        Открыть тренировки
      </Text>
    </SoftPress>
  );
}
