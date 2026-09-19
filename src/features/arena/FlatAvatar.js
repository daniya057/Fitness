import { View } from "react-native";

export function FlatAvatar() {
  return (
    <View className="items-center">
      <View className="h-44 w-36 items-center justify-end">
        <View className="absolute top-2 h-16 w-16 rounded-full bg-accent-soft border border-accent/20" />
        <View className="absolute top-[18px] h-9 w-9 rounded-full bg-accent/80" />
        <View className="mb-2 h-24 w-28 rounded-t-[40px] rounded-b-[28px] bg-accent-soft border border-accent/15" />
        <View className="absolute bottom-8 h-10 w-[72px] rounded-full bg-accent/25" />
      </View>
    </View>
  );
}
