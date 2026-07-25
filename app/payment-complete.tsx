import { MaterialIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../lib/api"
import { shortHash } from "../components/Toast"

type VerifyState = "checking" | "success" | "pending" | "error"

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default function PaymentComplete() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const reference = useMemo(
    () => firstParam(params.reference) || firstParam(params.trxref),
    [params.reference, params.trxref]
  )
  const [state, setState] = useState<VerifyState>("checking")
  const [message, setMessage] = useState("Confirming your payment...")

  async function verifyPayment() {
    if (!reference) {
      setState("error")
      setMessage("No payment reference was returned.")
      return
    }

    try {
      setState("checking")
      setMessage("Confirming your payment...")
      const { data } = await api.post("/payments/verify", { reference })

      if (data?.verified || data?.status === "Verified") {
        setState("success")
        setMessage("Payment verified. Your order is now paid.")
      } else {
        setState("pending")
        setMessage("Payment received, but verification is still pending.")
      }
    } catch (error: any) {
      setState("error")
      setMessage(error?.response?.data?.error || error.message || "Unable to verify payment.")
    }
  }

  useEffect(() => {
    verifyPayment()
  }, [reference])

  const iconName =
    state === "success" ? "check-circle" : state === "error" ? "error" : state === "pending" ? "hourglass-top" : "sync"
  const iconColor = state === "success" ? "#125C3F" : state === "error" ? "#B42318" : "#B26A00"

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <View className="flex-1 px-6 justify-center">
        <View className="bg-white rounded-2xl border border-gray-200 p-6 items-center">
          <MaterialIcons name={iconName} size={56} color={iconColor} />
          <Text className="text-2xl font-black text-[#2A5C43] mt-5 text-center">Payment Complete</Text>
          {reference ? (
            <Text className="text-gray-500 mt-2 text-center">Reference: {shortHash(reference)}</Text>
          ) : null}
          <Text className="text-gray-700 mt-4 text-center leading-6">{message}</Text>

          <Pressable
            className="mt-6 bg-[#2A5C43] rounded-xl py-4 px-5 items-center w-full"
            onPress={() => router.replace("/buyer/orders")}
          >
            <Text className="text-white font-black">Back to Orders</Text>
          </Pressable>

          {(state === "pending" || state === "error") && (
            <Pressable className="mt-3 py-3 px-5 items-center w-full" onPress={verifyPayment}>
              <Text className="text-[#2A5C43] font-black">Check Again</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
