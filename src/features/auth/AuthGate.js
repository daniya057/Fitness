import { Text, View } from "react-native";
import { useAuth } from "./AuthContext";
import AuthScreen from "./AuthScreen";

export function AuthGate({ children }) {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-[16px] text-mute">Секунду</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return children;
}
