import * as ImagePicker from "expo-image-picker";

const MAX = 180000;

export async function pickAvatarPhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Нужен доступ к фото");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });
  if (result.canceled) {
    return "";
  }
  const asset = result.assets && result.assets[0];
  if (!asset?.base64) {
    throw new Error("Не прочиталось фото");
  }
  const mime = asset.mimeType && asset.mimeType.startsWith("image/") ? asset.mimeType : "image/jpeg";
  const data = `data:${mime};base64,${asset.base64}`;
  if (data.length > MAX) {
    throw new Error("Фото слишком тяжёлое, обрежь квадрат поменьше");
  }
  return data;
}
