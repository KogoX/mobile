import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { getSessionUser } from "../../lib/session"
import NotificationBell from "../../components/NotificationBell"
import { shortHash } from "../../components/Toast"

type YieldItem = {
  id: number
  crop_season: string
  variety: string
  quantity: string
  grade: string
  created_at: string
}

type PayoutItem = {
  id: number
  order_id: number | null
  amount: string
  method: string
  status: string
  reference: string
  notes: string | null
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

type ActivityItem =
  | { type: "yield"; data: YieldItem; timestamp: number }
  | { type: "payout"; data: PayoutItem; timestamp: number }
  | { type: "order"; data: OrderItem; timestamp: number }

export default function FarmerDashboard() {
  const [name, setName] = useState("Farmer")
  const [uniqueId, setUniqueId] = useState("")
  const [yields, setYields] = useState<YieldItem[]>([])
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])

  const refresh = useCallback(async () => {
    try {
      const [yieldRes, payoutRes, orderRes, user] = await Promise.all([
        api.get("/yields"),
        api.get("/payouts"),
        api.get("/orders"),
        getSessionUser()
      ])
      setYields(yieldRes.data)
      setPayouts(payoutRes.data)
      setOrders(orderRes.data)
      if (user?.name) setName(user.name)
      if (user?.unique_id) setUniqueId(user.unique_id)
    } catch (err) {
      console.log("Failed to refresh farmer dashboard:", err)
    }
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
      payouts
        .filter((item) => item.status === "Paid")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payouts]
  )
  const pendingPayments = useMemo(
    () =>
      payouts
        .filter((item) => item.status !== "Paid")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payouts]
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

  const recentActivity = useMemo(() => {
    const activity: ActivityItem[] = [
      ...yields.map((y) => ({ type: "yield" as const, data: y, timestamp: new Date(y.created_at).getTime() })),
      ...payouts.map((p) => ({ type: "payout" as const, data: p, timestamp: new Date(p.created_at).getTime() })),
      ...orders.map((o) => ({ type: "order" as const, data: o, timestamp: new Date(o.created_at).getTime() })),
    ]
    return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15)
  }, [yields, payouts, orders])

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

        <Text className="text-xl font-black text-[#2A5C43] mb-3">Recent Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((item, idx) => {
            const isLast = idx === recentActivity.length - 1
            if (item.type === "yield") {
              const y = item.data
              return (
                <ActivityRow
                  key={`y-${y.id}`}
                  icon="add-chart"
                  color="#2A5C43"
                  bg="#E7F5EE"
                  title={`Logged ${Number(y.quantity).toLocaleString()} kg of ${y.variety}`}
                  subtitle={`Grade ${y.grade} • Season: ${y.crop_season}`}
                  time={new Date(y.created_at).toLocaleString()}
                  isLast={isLast}
                />
              )
            } else if (item.type === "order") {
              const o = item.data
              return (
                <ActivityRow
                  key={`o-${o.id}`}
                  icon="shopping-cart"
                  color="#d97706"
                  bg="#fef3c7"
                  title={`Order Assigned: ${Number(o.quantity).toLocaleString()} kg`}
                  subtitle={`Status: ${o.status} • KES ${Number(o.total_amount).toLocaleString()}`}
                  time={new Date(o.created_at).toLocaleString()}
                  isLast={isLast}
                />
              )
            } else {
              const p = item.data
              return (
                <ActivityRow
                  key={`p-${p.id}`}
                  icon="payments"
                  color="#059669"
                  bg="#d1fae5"
                  title={`Payout ${p.status}: KES ${Number(p.amount).toLocaleString()}`}
                  subtitle={`Method: ${p.method} ${p.order_id ? `• Order #${p.order_id}` : ''}`}
                  time={new Date(p.created_at).toLocaleString()}
                  isLast={isLast}
                />
              )
            }
          })
        ) : (
          <EmptyState title="No activity yet" message="When you log yields, receive orders, or get payouts, they will appear here." />
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

function ActivityRow({
  icon,
  color,
  bg,
  title,
  subtitle,
  time,
  isLast
}: {
  icon: keyof typeof MaterialIcons.glyphMap
  color: string
  bg: string
  title: string
  subtitle: string
  time: string
  isLast?: boolean
}) {
  return (
    <View className="flex-row">
      <View className="items-center mr-3">
        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: bg }}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        {!isLast && <View className="w-px flex-1 bg-gray-200 my-1" />}
      </View>
      <View className="flex-1 pb-4">
        <Text className="text-gray-900 font-bold text-sm leading-5">{title}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
        <Text className="text-gray-400 text-[10px] uppercase font-bold mt-1">{time}</Text>
      </View>
    </View>
  )
}
