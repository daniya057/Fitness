import { ScrollView, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";
import { useAuth } from "../auth/AuthContext";

const HISTORY = [
  { id: "1", title: "Микро-разминка", time: "08:14", done: true },
  { id: "2", title: "Минута фокуса", time: "12:02", done: true },
  { id: "3", title: "Тихая прогулка", time: "18:40", done: false },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, patch } = useAuth();
  const name = user?.name || "Гость";
  const status = user?.status || "Двигаюсь мягко";

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-3 rounded-panel border border-ink/5 bg-card px-6 py-7">
          <Text className="text-[12px] tracking-[2px] text-mute">Профиль</Text>
          <Text className="mt-2 text-[28px] font-light text-ink">{name}</Text>
          <Text className="mt-1 text-[14px] text-mute">{status}</Text>
          <Text className="mt-2 text-[13px] text-mute">{user?.email}</Text>
          <SoftPress onPress={logout} className="mt-6 self-start rounded-full border border-ink/10 px-4 py-2">
            <Text className="text-[12px] tracking-[1px] text-ink">Выйти</Text>
          </SoftPress>
        </View>

        <Text className="mb-3 mt-10 text-[13px] tracking-[1.5px] text-mute">История сегодня</Text>
        {HISTORY.map((item) => (
          <View
            key={item.id}
            className="mb-2 flex-row items-center rounded-2xl border border-ink/5 bg-card px-4 py-4"
          >
            <View
              className={`mr-3 h-6 w-6 items-center justify-center rounded-md ${item.done ? "bg-accent" : "border border-ink/20"}`}
            >
              {item.done ? <Check size={14} color="#FFFFFF" strokeWidth={2.2} /> : null}
            </View>
            <Text className="flex-1 text-[15px] font-light text-ink">{item.title}</Text>
            <Text className="text-[12px] text-mute">{item.time}</Text>
          </View>
        ))}

        <Text className="mb-3 mt-10 text-[13px] tracking-[1.5px] text-mute">Личное</Text>
        <View className="rounded-panel border border-ink/5 bg-card px-5 py-2">
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-[15px] font-light text-ink">Имя</Text>
            <Text className="text-[14px] text-mute">{name}</Text>
          </View>
          <View className="h-px bg-ink/5" />
          <SoftPress
            onPress={() =>
              patch({ status: status === "Двигаюсь мягко" ? "В тихом ритме" : "Двигаюсь мягко" })
            }
            className="flex-row items-center justify-between py-4"
          >
            <Text className="text-[15px] font-light text-ink">Статус</Text>
            <Text className="text-[14px] text-mute">{status}</Text>
          </SoftPress>
        </View>
      </ScrollView>
    </View>
  );
}
