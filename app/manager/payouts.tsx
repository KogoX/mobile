import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

type PaymentItem = {
  id: number
  order_id: number
  buyer: string
  quantity: string
  amount: string
  status: string
  created_at: string
}

export default function ManagerPayouts() {
  const [payments, setPayments] = useState<PaymentItem[]>([])

  const refresh = useCallback(async () => {
    const { data } = await api.get("/payments")
    setPayments(data)
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
    return {
      total: verified.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      count: verified.length
    }
  }, [payments])

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Payouts</Text>
        <Text className="text-gray-500 mt-1 mb-5">Verified and pending payment settlements.</Text>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <Text className="text-[11px] text-gray-500 uppercase font-bold">Verified totals</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">KES {totals.total.toLocaleString()}</Text>
          <Text className="text-gray-500 mt-1">{totals.count} verified payments</Text>
        </View>

        {payments.map((row) => (
          <View key={row.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <Text className="text-lg font-black text-[#2A5C43]">Payment #{row.id}</Text>
            <Text className="text-gray-700">Order #{row.order_id} • {row.buyer || "Buyer"}</Text>
            <Text className="text-gray-700">Qty: {Number(row.quantity || 0).toLocaleString()} kg</Text>
            <Text className="text-gray-900 font-bold mt-1">KES {Number(row.amount || 0).toLocaleString()}</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {row.status} • {new Date(row.created_at).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
