import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import api from "../lib/api";

type Props = {
  visible: boolean;
  authUrl: string | null;
  reference: string | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function PaystackModal({
  visible,
  authUrl,
  reference,
  onSuccess,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  if (!visible || !authUrl) return null;

  async function handleComplete() {
    if (verifying) return;
    setVerifying(true);
    try {
      if (reference) {
        await api.post("/payments/verify", { reference });
      }
      onSuccess();
    } catch (err) {
      console.warn("Auto verification check:", err);
      onSuccess();
    } finally {
      setVerifying(false);
    }
  }

  function handleNavigationStateChange(navState: any) {
    const url = navState.url || "";
    if (
      url.includes("/payment-complete") ||
      url.includes("status=success") ||
      url.includes("trxref=") ||
      url.includes("reference=")
    ) {
      handleComplete();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView className="flex-1 bg-[#125C3F]">
        {/* Top Header */}
        <View className="bg-[#125C3F] px-4 py-3 flex-row items-center justify-between border-b border-[#1f7252]">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="lock-outline" size={20} color="#ffffff" />
            <Text className="text-white font-black text-base">
              Paystack Secure Checkout
            </Text>
          </View>
          <Pressable
            onPress={onCancel}
            className="h-9 w-9 rounded-full bg-white/10 items-center justify-center"
          >
            <MaterialIcons name="close" size={20} color="#ffffff" />
          </Pressable>
        </View>

        {/* Content Container */}
        <View className="flex-1 bg-white relative">
          {loading || verifying ? (
            <View className="absolute inset-0 z-10 bg-white/90 items-center justify-center p-4">
              <ActivityIndicator size="large" color="#2A5C43" />
              <Text className="text-[#2A5C43] font-bold mt-3 text-sm">
                {verifying
                  ? "Verifying your payment..."
                  : "Loading Paystack Checkout..."}
              </Text>
            </View>
          ) : null}

          {Platform.OS === "web" ? (
            <iframe
              src={authUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              onLoad={() => setLoading(false)}
            />
          ) : (
            <WebView
              source={{ uri: authUrl }}
              onLoadEnd={() => setLoading(false)}
              onNavigationStateChange={handleNavigationStateChange}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
