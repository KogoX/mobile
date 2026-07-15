import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { shortHash } from "../../components/Toast"

type Order = {
  id: number
  quantity: string
  produce: string
  unit_price: string
  total_amount: string
  status: string
  payment_status: string | null
  created_at: string
}

export default function BuyerInvoices() {
  const [orders, setOrders] = useState<Order[]>([])

  const refresh = useCallback(async () => {
    const { data } = await api.get("/orders")
    setOrders(data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  const totals = useMemo(() => {
    const paid = orders.filter((order) => order.status === "Paid" || order.payment_status === "Verified")
    const unpaid = orders.filter((order) => order.status !== "Paid" && order.payment_status !== "Verified")
    return {
      paid: paid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      unpaid: unpaid.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    }
  }, [orders])

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Invoices</Text>
        <Text className="text-gray-500 mt-1 mb-5">Order invoices generated from your live purchase history.</Text>

        <View className="flex-row gap-3 mb-4">
          <Metric label="Paid" value={`KES ${totals.paid.toLocaleString()}`} icon="verified" />
          <Metric label="Outstanding" value={`KES ${totals.unpaid.toLocaleString()}`} icon="pending-actions" />
        </View>

        {orders.map((order) => {
          const paid = order.status === "Paid" || order.payment_status === "Verified"
          return (
            <View key={order.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-black text-[#2A5C43]">Invoice #{shortHash(order.id)}</Text>
                  <Text className="text-gray-700 mt-1">{order.produce}</Text>
                </View>
                <View className={`rounded-full px-3 py-1 ${paid ? "bg-[#E7F5EE]" : "bg-amber-100"}`}>
                  <Text className={`text-[11px] uppercase font-black ${paid ? "text-[#2A5C43]" : "text-amber-700"}`}>
                    {paid ? "Paid" : "Due"}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-700 mt-3">Quantity: {Number(order.quantity || 0).toLocaleString()} kg</Text>
              <Text className="text-gray-700">Unit price: KES {Number(order.unit_price || 0).toLocaleString()}</Text>
              <Text className="text-gray-900 font-black mt-1">Total: KES {Number(order.total_amount || 0).toLocaleString()}</Text>
              <Text className="text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</Text>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 min-h-[110px]">
      <MaterialIcons name={icon} size={21} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">{label}</Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  )
}
