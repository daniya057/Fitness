import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { ChevronDown, CircleHelp } from "lucide-react-native";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { PillButton } from "../../ui/kit";
import { lightTap } from "../../lib/haptics";
import { moveHint, uniqueMoveTitles } from "./moves";

function HelpIcon() {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full" style={glassStyle({ variant: "fill", borderRadius: 999 })}>
      <CircleHelp size={16} color={getPalette().accent} strokeWidth={1.8} />
    </View>
  );
}

export function MoveHintButton({ title, onPress }) {
  if (!title) {
    return null;
  }
  return (
    <Pressable
      onPress={async () => {
        await lightTap();
        onPress(title);
      }}
      className="mt-3 self-center rounded-full px-4"
      style={[glassStyle({ variant: "fill", borderRadius: 999 }), { flexDirection: "row", alignItems: "center", minHeight: 44 }]}
    >
      <CircleHelp size={16} color={getPalette().accent} strokeWidth={1.8} />
      <Text className="ml-2 text-[13px] font-medium text-white">Справка</Text>
    </Pressable>
  );
}

export function MoveHintRow({ title, onPress }) {
  return (
    <Pressable
      onPress={async () => {
        await lightTap();
        onPress(title);
      }}
      className="mt-1 flex-row items-center px-1"
      style={{ minHeight: 44 }}
    >
      <Text className="mr-3 flex-1 text-[13px] leading-5 text-white" numberOfLines={1}>
        {title}
      </Text>
      <HelpIcon />
    </Pressable>
  );
}

export function MoveList({ session, onHint }) {
  const [open, setOpen] = useState(false);
  const titles = uniqueMoveTitles(session);
  if (!titles.length) {
    return null;
  }

  return (
    <View className="mt-3">
      <Pressable
        onPress={async () => {
          await lightTap();
          setOpen((prev) => !prev);
        }}
        className="flex-row items-center self-start"
        style={{ minHeight: 44 }}
      >
        <Text className="mr-1 text-[14px] font-medium" style={{ color: getPalette().accent }}>
          {open ? "Скрыть список" : "Список упражнений"}
        </Text>
        <ChevronDown
          size={18}
          color={getPalette().accent}
          strokeWidth={1.8}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {open
        ? titles.map((title) => <MoveHintRow key={title} title={title} onPress={onHint} />)
        : null}
    </View>
  );
}

export function MoveHintModal({ title, onClose }) {
  if (!title) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ width: "100%", maxWidth: 360, borderRadius: 32, paddingHorizontal: 24, paddingVertical: 28, ...glassStyle({ borderRadius: 32 }) }}>
          <Text className="text-center text-[20px] font-semibold text-white">{title}</Text>
          <Text className="mt-3 text-center text-[15px] leading-6 text-white/70">{moveHint(title)}</Text>
          <View className="mt-6 items-center">
            <PillButton label="Понятно" onPress={onClose} tone="glassOn" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
