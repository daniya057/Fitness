import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { lightTap } from "../../lib/haptics";
import { useAuth } from "../auth/AuthContext";
import { AvatarBadge } from "./AvatarBadge";

export function ProfileChip() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Pressable
      onPress={async () => {
        await lightTap();
        router.replace("/profile");
      }}
      hitSlop={8}
    >
      <AvatarBadge user={user} size="sm" />
    </Pressable>
  );
}
