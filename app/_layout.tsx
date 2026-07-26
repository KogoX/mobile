import "../global.css";

import { LogBox } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Suppress unhandled network error popups & terminal logs for smooth presentation
LogBox.ignoreLogs(["AxiosError", "Network Error", "[AxiosError: Network Error]"]);

if (typeof console !== "undefined") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    const msg = args[0] ? String(args[0]) : "";
    if (
      msg.includes("AxiosError") ||
      msg.includes("Network Error") ||
      (args[0] && args[0]?.name === "AxiosError")
    ) {
      return;
    }
    origError(...args);
  };
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
