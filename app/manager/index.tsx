import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Alert, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { notifyNewListing } from "../../lib/notifications"

type Farmer = {
  id: string
  name: string
  location: string | null
  status: string
  total_yield_kg: string
}

type YieldItem = {
  id: number
  farmer: string
  crop_season: string
  variety: string
  quantity: string
  grade: string
  status: string
  created_at: string
}

type OrderItem = {
  id: number
  buyer: string
  produce: string
  quantity: string
  total_amount: string
  status: string
  payment_status?: string | null
  created_at: string
}

type PaymentItem = {
  id: number
  amount: string
  status: string
}

const managerHarvestCountKey = "managerHarvestCount"

export default function ManagerDashboard() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [yields, setYields] = useState<YieldItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])

  const refresh = useCallback(async () => {
    const [farmersRes, yieldsRes, ordersRes, paymentsRes] = await Promise.all([
      api.get("/farmers"),
      api.get("/yields"),
      api.get("/orders"),
      api.get("/payments")
    ])
    const previousRaw = await AsyncStorage.getItem(managerHarvestCountKey)
    const previousCount = previousRaw ? Number(previousRaw) : yieldsRes.data.length

    if (yieldsRes.data.length > previousCount) {
      await notifyNewListing("New farmer harvest", `${yieldsRes.data.length - previousCount} new harvest record(s) need review.`)
    }

    await AsyncStorage.setItem(managerHarvestCountKey, String(yieldsRes.data.length))
    setFarmers(farmersRes.data)
    setYields(yieldsRes.data)
    setOrders(ordersRes.data)
    setPayments(paymentsRes.data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  const totals = useMemo(() => {
    const approvedSupply = yields
      .filter((item) => ["Approved", "Scheduled", "Exported"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const openDemand = orders
      .filter((item) => !["Paid", "Fulfilled", "Cancelled"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const paidAmount = payments
      .filter((item) => item.status === "Verified")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const pendingYields = yields.filter((item) => item.status === "Logged").length
    const pendingOrders = orders.filter((item) => item.status === "Processing").length

    return {
      approvedSupply,
      openDemand,
      paidAmount,
      pendingYields,
      pendingOrders,
      balance: approvedSupply - openDemand
    }
  }, [orders, payments, yields])

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

  const queueYields = yields.filter((item) => item.status === "Logged").slice(0, 3)
  const queueOrders = orders.filter((item) => item.status === "Processing").slice(0, 3)

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-3xl font-black text-[#2A5C43]">Operational Overview</Text>
            <Text className="text-gray-500 mt-1">Coordinate farmer harvests with buyer demand.</Text>
          </View>
          <View className="h-11 w-11 rounded-full bg-white border border-gray-200 items-center justify-center">
            <MaterialIcons name="notifications-none" size={24} color="#2A5C43" />
          </View>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-4">
          <Metric label="Farmers" value={farmers.length.toLocaleString()} icon="groups" />
          <Metric label="Approved Supply" value={`${totals.approvedSupply.toLocaleString()} kg`} icon="eco" />
          <Metric label="Open Demand" value={`${totals.openDemand.toLocaleString()} kg`} icon="shopping-cart" />
          <Metric label="Disbursed" value={`KES ${totals.paidAmount.toLocaleString()}`} icon="payments" />
        </View>

        <View className={`rounded-2xl p-4 mb-4 ${totals.balance >= 0 ? "bg-[#125C3F]" : "bg-[#7C2D12]"}`}>
          <Text className="text-white text-lg font-black">Supply Match</Text>
          <Text className="text-white mt-2">
            {totals.balance >= 0
              ? `${totals.balance.toLocaleString()} kg available after current buyer demand.`
              : `${Math.abs(totals.balance).toLocaleString()} kg shortage against open buyer orders.`}
          </Text>
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-2">Approval Queue</Text>
        {queueYields.map((item) => (
          <QueueCard
            key={`yield-${item.id}`}
            title={`Harvest #${item.id}`}
            subtitle={`${item.farmer || "Farmer"} - ${item.variety} - Grade ${item.grade}`}
            amount={`${Number(item.quantity || 0).toLocaleString()} kg`}
            approveLabel="Approve"
            rejectLabel="Reject"
            onApprove={() => updateYield(item.id, "Approved")}
            onReject={() => updateYield(item.id, "Rejected")}
          />
        ))}
        {queueOrders.map((item) => (
          <QueueCard
            key={`order-${item.id}`}
            title={`Order #${item.id}`}
            subtitle={`${item.buyer || "Buyer"} - ${item.produce}`}
            amount={`${Number(item.quantity || 0).toLocaleString()} kg`}
            approveLabel="Schedule"
            rejectLabel="Cancel"
            onApprove={() => updateOrder(item.id, "Scheduled")}
            onReject={() => updateOrder(item.id, "Cancelled")}
          />
        ))}
        {!queueYields.length && !queueOrders.length ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="font-black text-[#2A5C43]">All clear</Text>
            <Text className="text-gray-500 mt-1">New harvest submissions and buyer orders will appear here.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 min-h-[116px] flex-1 min-w-[155px]">
      <MaterialIcons name={icon} size={22} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">{label}</Text>
      <Text className="text-[#2A5C43] text-xl font-black mt-1">{value}</Text>
    </View>
  )
}

function QueueCard({
  title,
  subtitle,
  amount,
  approveLabel,
  rejectLabel,
  onApprove,
  onReject
}: {
  title: string
  subtitle: string
  amount: string
  approveLabel: string
  rejectLabel: string
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-black text-[#2A5C43]">{title}</Text>
          <Text className="text-gray-700 mt-1">{subtitle}</Text>
        </View>
        <Text className="font-black text-gray-900">{amount}</Text>
      </View>
      <View className="flex-row gap-3 mt-4">
        <Pressable onPress={onApprove} className="flex-1 bg-[#2A5C43] rounded-xl py-3 items-center">
          <Text className="text-white font-black">{approveLabel}</Text>
        </Pressable>
        <Pressable onPress={onReject} className="flex-1 bg-white border border-red-300 rounded-xl py-3 items-center">
          <Text className="text-red-600 font-black">{rejectLabel}</Text>
        </Pressable>
      </View>
    </View>
  )
}
