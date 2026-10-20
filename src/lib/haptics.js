import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function lightTap() {
  if (Platform.OS === "web") {
    return;
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function celebrateTap() {
  if (Platform.OS === "web") {
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
