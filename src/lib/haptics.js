import * as Haptics from "expo-haptics";

export async function lightTap() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Веб и симуляторы без тактильного движка просто пропускают вибро.
  }
}

export async function celebrateTap() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Веб и симуляторы без тактильного движка просто пропускают вибро.
  }
}
