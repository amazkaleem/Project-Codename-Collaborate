import { Redirect } from "expo-router";

export default function RootIndex() {
  // Redirect to the home tab by default
  return <Redirect href="/(root)/(tabs)/home" />;
}
