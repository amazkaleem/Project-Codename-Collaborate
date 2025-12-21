import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useTheme } from "@/contexts/ThemeContext";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();
  const { colors: COLORS } = useTheme();

  if (isSignedIn) {
    return <Redirect href={"/(root)/(tabs)/home"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    />
  );
}
