import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

type YieldItem = {
  id: number
  farmer: string
  crop_season: string
  variety: string
  quantity: string
  grade: string
  status: string
  photos: string[]
  created_at: string
}

type OrderItem = {
  id: number
  buyer: string
  farmer?: string | null
  yield_id?: number | null
  produce: string
  quantity: string
  total_amount: string
  status: string
  payment_status?: string | null
  created_at: string
}

type Mode = "harvests" | "orders"

export default function ManagerOrders() {
  const [mode, setMode] = useState<Mode>("harvests")
  const [query, setQuery] = useState("")
  const [yields, setYields] = useState<YieldItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])

  const refresh = useCallback(async () => {
    const [yieldRes, orderRes] = await Promise.all([api.get("/yields"), api.get("/orders")])
    setYields(yieldRes.data)
    setOrders(orderRes.data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  const filteredYields = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return yields
    return yields.filter((item) =>
      [item.farmer, item.crop_season, item.variety, item.grade, item.status]
        .some((value) => String(value || "").toLowerCase().includes(needle))
    )
  }, [query, yields])

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return orders
    return orders.filter((item) =>
      [item.buyer, item.farmer, item.produce, item.status, item.payment_status]
        .some((value) => String(value || "").toLowerCase().includes(needle))
    )
  }, [orders, query])

  const stats = useMemo(() => {
    const approvedSupply = yields
      .filter((item) => ["Approved", "Scheduled", "Exported"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const openDemand = orders
      .filter((item) => !["Paid", "Fulfilled", "Cancelled"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const exportGrade = yields.filter((item) => item.grade === "A").length
    return { approvedSupply, openDemand, exportGrade }
  }, [orders, yields])

  async function updateYield(id: number, status: string) {
    try {
      await api.patch(`/yields/${id}/status`, { status })
      refresh()
    } catch (error: any) {
      Alert.alert("Unable to update harvest", error?.response?.data?.error || error.message)
    }
  }

  async function updateOrder(id: number, status: string) {
    try {
      await api.patch(`/orders/${id}/status`, { status })
      refresh()
    } catch (error: any) {
      Alert.alert("Unable to update order", error?.response?.data?.error || error.message)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Harvests & Orders</Text>
        <Text className="text-gray-500 mt-1 mb-5">Match farmer supply to buyer demand and advance export flow.</Text>

        <View className="flex-row gap-3 mb-4">
          <Metric label="Approved Supply" value={`${stats.approvedSupply.toLocaleString()} kg`} />
          <Metric label="Open Demand" value={`${stats.openDemand.toLocaleString()} kg`} />
          <Metric label="Grade A Lots" value={stats.exportGrade.toLocaleString()} />
        </View>

        <View className="flex-row bg-white rounded-2xl border border-gray-200 p-1 mb-4">
          <Segment label="Harvests" active={mode === "harvests"} onPress={() => setMode("harvests")} />
          <Segment label="Orders" active={mode === "orders"} onPress={() => setMode("orders")} />
        </View>

        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-4">
          <MaterialIcons name="search" size={20} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={mode === "harvests" ? "Search harvests, farmers, grades..." : "Search buyers, orders, status..."}
            placeholderTextColor="#9ca3af"
            className="flex-1 min-h-[48px] ml-2 text-gray-800"
            style={{ outlineStyle: "none" } as never}
          />
        </View>

        {mode === "harvests"
          ? filteredYields.map((row) => (
              <View key={row.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-[#2A5C43]">Harvest #{row.id}</Text>
                    <Text className="text-gray-700 mt-1">{row.farmer || "Farmer"} - {row.crop_season}</Text>
                    <Text className="text-gray-700">{row.variety} - Grade {row.grade}</Text>
                  </View>
                  <StatusPill status={row.status} />
                </View>
                <Text className="text-gray-900 font-black mt-3">{Number(row.quantity).toLocaleString()} kg</Text>
                <Text className="text-gray-500 mt-1">{new Date(row.created_at).toLocaleString()}</Text>
                {row.photos?.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                    <View className="flex-row gap-2">
                      {row.photos.map((uri, index) => (
                        <Image key={`${row.id}-${index}`} source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} contentFit="cover" />
                      ))}
                    </View>
                  </ScrollView>
                ) : null}
                <View className="flex-row gap-2 mt-4">
                  <Action label="Approve" onPress={() => updateYield(row.id, "Approved")} />
                  <Action label="Schedule" tone="neutral" onPress={() => updateYield(row.id, "Scheduled")} />
                  <Action label="Reject" tone="danger" onPress={() => updateYield(row.id, "Rejected")} />
                </View>
              </View>
            ))
          : filteredOrders.map((row) => (
              <View key={row.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-[#2A5C43]">Order #{row.id}</Text>
                    <Text className="text-gray-700 mt-1">{row.buyer || "Buyer"} - {row.produce}</Text>
                    <Text className="text-gray-700">{Number(row.quantity || 0).toLocaleString()} kg requested</Text>
                    <Text className="text-gray-500 mt-1">
                      {row.farmer ? `Assigned to ${row.farmer} via harvest #${row.yield_id}` : "Not assigned to a farmer yet"}
                    </Text>
                  </View>
                  <StatusPill status={row.status} />
                </View>
                <Text className="text-gray-900 font-black mt-3">KES {Number(row.total_amount || 0).toLocaleString()}</Text>
                <Text className="text-gray-500 mt-1">Payment: {row.payment_status || "Not received"}</Text>
                <View className="flex-row gap-2 mt-4">
                  <Action label="Approve" onPress={() => updateOrder(row.id, "Approved")} />
                  <Action label="Schedule" tone="neutral" onPress={() => updateOrder(row.id, "Scheduled")} />
                  <Action label="Cancel" tone="danger" onPress={() => updateOrder(row.id, "Cancelled")} />
                </View>
              </View>
            ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200">
      <Text className="text-[10px] text-gray-500 uppercase font-black">{label}</Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  )
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`flex-1 rounded-xl py-3 items-center ${active ? "bg-[#2A5C43]" : ""}`}>
      <Text className={`font-black ${active ? "text-white" : "text-gray-600"}`}>{label}</Text>
    </Pressable>
  )
}

function StatusPill({ status }: { status: string }) {
  const bad = ["Rejected", "Cancelled"].includes(status)
  const done = ["Approved", "Scheduled", "Paid", "Fulfilled", "Exported"].includes(status)
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
