import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { getSessionUser } from "../../lib/session"

type YieldItem = {
  id: number
  crop_season: string
  variety: string
  quantity: string
  grade: string
  created_at: string
}

type PaymentItem = {
  id: number
  amount: string
  status: string
  created_at: string
}

type OrderItem = {
  id: number
  produce: string
  quantity: string
  total_amount: string
  status: string
  created_at: string
}

export default function FarmerDashboard() {
  const [name, setName] = useState("Farmer")
  const [uniqueId, setUniqueId] = useState("")
  const [yields, setYields] = useState<YieldItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])

  const refresh = useCallback(async () => {
    const [yieldRes, paymentRes, orderRes, user] = await Promise.all([
      api.get("/yields"),
      api.get("/payments"),
      api.get("/orders"),
      getSessionUser()
    ])
    setYields(yieldRes.data)
    setPayments(paymentRes.data)
    setOrders(orderRes.data)
    if (user?.name) setName(user.name)
    if (user?.unique_id) setUniqueId(user.unique_id)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  const totalYield = useMemo(
    () => yields.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0),
    [yields]
  )
  const totalPaid = useMemo(
    () =>
      payments
        .filter((item) => item.status === "Verified")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payments]
  )
  const pendingPayments = useMemo(
    () =>
      payments
        .filter((item) => item.status !== "Verified")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payments]
  )
  const marketDemand = useMemo(
    () => orders.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [orders]
  )
  const gradeTotals = useMemo(
    () =>
      yields.reduce<Record<string, number>>((totals, entry) => {
        totals[entry.grade] = (totals[entry.grade] || 0) + Number(entry.quantity || 0)
        return totals
      }, {}),
    [yields]
  )

  const latestYield = yields[0]
  const strongestGrade = Object.entries(gradeTotals).sort((a, b) => b[1] - a[1])[0]

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Good morning, {name}</Text>
        {uniqueId ? (
          <Text className="text-gray-500 font-bold mt-1">Farmer Code: {uniqueId}</Text>
        ) : null}
        <Text className="text-gray-500 mt-1 mb-5">
          Your farm activity, payouts and market demand from live records.
        </Text>

        <View className="flex-row gap-3 mb-3">
          <SummaryCard icon="eco" label="Total Yield" value={`${totalYield.toLocaleString()} kg`} />
          <SummaryCard icon="verified" label="Paid Out" value={`KES ${totalPaid.toLocaleString()}`} />
        </View>
        <View className="flex-row gap-3 mb-4">
          <SummaryCard icon="hourglass-top" label="Pending" value={`KES ${pendingPayments.toLocaleString()}`} />
          <SummaryCard icon="shopping-cart" label="Demand" value={`${marketDemand.toLocaleString()} kg`} />
        </View>

        <View className="bg-[#125C3F] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-lg font-black">Harvest Snapshot</Text>
            <MaterialIcons name="insights" size={22} color="#D7F3E5" />
          </View>
          <Text className="text-[#D7F3E5] mt-2">
            {latestYield
              ? `Latest: ${Number(latestYield.quantity).toLocaleString()} kg of ${latestYield.variety}, Grade ${latestYield.grade}.`
              : "Log your first harvest to start tracking performance."}
          </Text>
          <View className="flex-row gap-2 mt-4">
            {["A", "B", "C"].map((grade) => (
              <View key={grade} className="flex-1 bg-white/10 rounded-xl p-3">
                <Text className="text-[#D7F3E5] text-[10px] font-black uppercase">Grade {grade}</Text>
                <Text className="text-white font-black mt-1">{(gradeTotals[grade] || 0).toLocaleString()} kg</Text>
              </View>
            ))}
          </View>
          {strongestGrade ? (
            <Text className="text-white mt-3 font-bold">
              Top grade: {strongestGrade[0]} with {strongestGrade[1].toLocaleString()} kg
            </Text>
          ) : null}
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-2">Recent Yields</Text>
        {yields.length ? (
          yields.slice(0, 6).map((entry) => (
            <View key={entry.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <Text className="font-black text-[#2A5C43]">
                {entry.crop_season} - Grade {entry.grade}
              </Text>
              <Text className="text-gray-700">{entry.variety}</Text>
              <Text className="text-gray-800 font-bold mt-1">{Number(entry.quantity).toLocaleString()} kg</Text>
              <Text className="text-gray-500 text-sm mt-1">{new Date(entry.created_at).toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="No harvest records yet" message="Use Log Yield to submit your first harvest record." />
        )}

        <Text className="text-xl font-black text-[#2A5C43] mt-2 mb-2">Market Demand</Text>
        {orders.length ? (
          orders.slice(0, 3).map((order) => (
            <View key={order.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-black text-[#2A5C43]">{order.produce}</Text>
                <Text className="text-[11px] text-[#2A5C43] font-black">{order.status}</Text>
              </View>
              <Text className="text-gray-700 mt-1">{Number(order.quantity).toLocaleString()} kg requested</Text>
              <Text className="text-gray-900 font-black mt-1">KES {Number(order.total_amount || 0).toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="No active market demand" message="Buyer requests will appear here as they are created." />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon: keyof typeof MaterialIcons.glyphMap
  label: string
  value: string
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 min-h-[116px]">
      <MaterialIcons name={icon} size={21} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">{label}</Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
      <Text className="text-[#2A5C43] font-black">{title}</Text>
      <Text className="text-gray-500 mt-1">{message}</Text>
    </View>
  )
}
