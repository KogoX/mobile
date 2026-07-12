import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

export default function ManagerDashboard() {
  const [farmers, setFarmers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])

  const refresh = useCallback(async () => {
    const [farmersRes, ordersRes, paymentsRes] = await Promise.all([
      api.get("/farmers"),
      api.get("/orders"),
      api.get("/payments")
    ])
    setFarmers(farmersRes.data)
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
    const totalYield = farmers.reduce((sum, item) => sum + Number(item.total_yield_kg || 0), 0)
    const activeOrders = orders.filter((item) => item.status !== "Paid").length
    const paidAmount = payments
      .filter((item) => item.status === "Verified")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    return { totalYield, activeOrders, paidAmount }
  }, [farmers, orders, payments])

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Manager Dashboard</Text>
        <Text className="text-gray-500 mt-1 mb-5">Realtime operations across farmers, orders and payments.</Text>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
          <Text className="text-[11px] text-gray-500 uppercase font-bold">Total Farmers</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">{farmers.length}</Text>
        </View>
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
          <Text className="text-[11px] text-gray-500 uppercase font-bold">Total Yield Logged</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">{totals.totalYield.toLocaleString()} kg</Text>
        </View>
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
          <Text className="text-[11px] text-gray-500 uppercase font-bold">Active Orders</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">{totals.activeOrders}</Text>
        </View>
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <Text className="text-[11px] text-gray-500 uppercase font-bold">Verified Payments</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">KES {totals.paidAmount.toLocaleString()}</Text>
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-2">Latest Orders</Text>
        {orders.slice(0, 6).map((order) => (
          <View key={order.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <Text className="font-black text-[#2A5C43]">Order #{order.id}</Text>
            <Text className="text-gray-700">
              {order.buyer || "Buyer"} • {Number(order.quantity).toLocaleString()} kg
            </Text>
            <Text className="text-gray-500 text-sm">{order.status}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
