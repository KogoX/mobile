import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { usePollingRefresh } from "../../lib/polling"
import { Toast, shortHash } from "../../components/Toast"

type PaymentItem = {
  id: string
  order_id: string
  buyer: string
  quantity: string
  amount: string
  status: string
  created_at: string
}

type ToastMsg = { text: string; type: "success" | "error" | "info" } | null

export default function ManagerPayouts() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [toast, setToast] = useState<ToastMsg>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  function showToast(text: string, type: "success" | "error" | "info" = "success") {
    setToast({ text, type })
  }

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/payments")
      setPayments(data)
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || "Failed to load payments", "error")
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  const totals = useMemo(() => {
    const verified = payments.filter((item) => item.status === "Verified")
    const pending = payments.filter((item) => item.status === "Pending")
    const held = payments.filter((item) => item.status === "Held")
    return {
      verifiedAmount: verified.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      pendingAmount: pending.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      heldAmount: held.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      verifiedCount: verified.length
    }
  }, [payments])

  async function updatePayment(id: string, status: string) {
    setUpdatingId(id)
    try {
      await api.patch(`/payments/${id}/status`, { status })
      await refresh()
      const label =
        status === "Verified" ? "Payment verified" :
        status === "Held" ? "Payment held" :
        status === "Rejected" ? "Payment rejected" :
        `Payment ${status.toLowerCase()}`
      showToast(label, status === "Rejected" || status === "Held" ? "info" : "success")
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || "Unable to update payment", "error")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <Toast message={toast} onDone={() => setToast(null)} />
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Payments Dashboard</Text>
        <Text className="text-gray-500 mt-1 mb-5">Confirm buyer payments and release settlement flow.</Text>

        <View className="flex-row flex-wrap gap-3 mb-4">
          <Metric label="Disbursed" value={`KES ${totals.verifiedAmount.toLocaleString()}`} icon="verified" />
          <Metric label="Pending" value={`KES ${totals.pendingAmount.toLocaleString()}`} icon="pending-actions" />
          <Metric label="Held" value={`KES ${totals.heldAmount.toLocaleString()}`} icon="front-hand" />
        </View>

        <View className="bg-[#125C3F] rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-black">Settlement Status</Text>
          <Text className="text-[#D7F3E5] mt-2">
            {totals.verifiedCount} payments verified. Verified payments automatically mark their orders as paid.
          </Text>
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-2">Recent Transactions</Text>
        {payments.length === 0 ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="font-black text-[#2A5C43]">No payments yet</Text>
            <Text className="text-gray-500 mt-1">Buyer payments will appear here once submitted.</Text>
          </View>
        ) : (
          payments.map((row) => (
            <View key={row.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-black text-[#2A5C43]">Payment #{shortHash(row.id)}</Text>
                  <Text className="text-gray-700 mt-1">
                    Order #{row.order_id ? shortHash(row.order_id) : "—"} · {row.buyer || "Buyer"}
                  </Text>
                  <Text className="text-gray-700">Qty: {Number(row.quantity || 0).toLocaleString()} kg</Text>
                </View>
                <StatusPill status={row.status} />
              </View>
              <Text className="text-gray-900 font-black mt-3">KES {Number(row.amount || 0).toLocaleString()}</Text>
              <Text className="text-gray-500 mt-1">{new Date(row.created_at).toLocaleString()}</Text>
              {updatingId === row.id ? (
                <View className="flex-row gap-2 mt-4 items-center justify-center py-2">
                  <ActivityIndicator size="small" color="#2A5C43" />
                  <Text className="text-gray-500 font-bold text-sm">Updating…</Text>
                </View>
              ) : (
                <View className="flex-row gap-2 mt-4">
                  <Action label="Verify" onPress={() => updatePayment(row.id, "Verified")} />
                  <Action label="Hold" tone="neutral" onPress={() => updatePayment(row.id, "Held")} />
                  <Action label="Reject" tone="danger" onPress={() => updatePayment(row.id, "Rejected")} />
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 min-h-[116px] flex-1 min-w-[155px]">
      <MaterialIcons name={icon} size={22} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">{label}</Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  )
}

function StatusPill({ status }: { status: string }) {
  const bad = ["Rejected", "Held"].includes(status)
  const done = status === "Verified"
  return (
    <View className={`rounded-full px-3 py-1 ${bad ? "bg-red-100" : done ? "bg-[#E7F5EE]" : "bg-amber-100"}`}>
      <Text className={`text-[11px] font-black uppercase ${bad ? "text-red-700" : done ? "text-[#2A5C43]" : "text-amber-700"}`}>
        {status}
      </Text>
    </View>
  )
}

function Action({
  label,
  onPress,
  tone = "primary"
}: {
  label: string
  onPress: () => void
  tone?: "primary" | "neutral" | "danger"
}) {
  const classes =
    tone === "primary"
      ? "bg-[#2A5C43]"
      : tone === "danger"
        ? "bg-white border border-red-300"
        : "bg-white border border-gray-200"
  const text = tone === "primary" ? "text-white" : tone === "danger" ? "text-red-600" : "text-gray-700"
  return (
    <Pressable onPress={onPress} className={`flex-1 rounded-xl py-3 items-center ${classes}`}>
      <Text className={`font-black ${text}`}>{label}</Text>
    </Pressable>
  )
}
