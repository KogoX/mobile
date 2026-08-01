import "../global.css";

import { LogBox, Platform } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Suppress unhandled network error popups & terminal logs for smooth presentation
LogBox.ignoreLogs(["AxiosError", "Network Error", "[AxiosError: Network Error]"]);

function isFontLoadTimeout(value: unknown) {
  const message =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "message" in value
        ? String((value as { message?: unknown }).message)
        : "";

  return (
    message.includes("6000ms timeout exceeded") ||
    message.includes("fontfaceobserver")
  );
}

if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (isFontLoadTimeout(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    if (isFontLoadTimeout(event.error) || isFontLoadTimeout(event.message)) {
      event.preventDefault();
    }
  });
}

if (typeof console !== "undefined") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    const msg = args[0] ? String(args[0]) : "";
    if (
      msg.includes("AxiosError") ||
      msg.includes("Network Error") ||
      isFontLoadTimeout(args[0]) ||
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
