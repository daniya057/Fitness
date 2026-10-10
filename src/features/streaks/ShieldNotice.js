import { Modal, Text, View } from "react-native";
import { Shield } from "lucide-react-native";
import { GlassPanel, glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { PillButton } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";

export function ShieldNotice() {
  const { user, patch } = useAuth();

  if (!user?.shieldNotice) {
    return null;
  }

  const close = () => {
    patch({ shieldNoticeSeen: true }).catch(() => {});
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <GlassPanel glow style={{ width: "100%", maxWidth: 360, borderRadius: 32, paddingHorizontal: 24, paddingVertical: 28 }}>
          <View className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full" style={glassStyle({ variant: "fill", borderRadius: 999 })}>
              <Shield size={28} color={getPalette().accent} strokeWidth={1.8} fill={getPalette().accent} />
            </View>
            <Text className="mt-4 text-center text-[22px] font-semibold text-white">Серия спасена щитом</Text>
            <Text className="mt-2 text-center text-[14px] leading-5 text-white/60">
              Пропуск не сбил счётчик. Щит списан — следующий день без тренировки уже не прикроет.
            </Text>
          </View>
          <View className="mt-6 items-center">
            <PillButton label="Понятно" onPress={close} tone="glassOn" />
          </View>
        </GlassPanel>
      </View>
    </Modal>
  );
}
