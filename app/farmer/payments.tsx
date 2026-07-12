import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

type Payment = {
  id: number
  order_id: number
  buyer: string
  quantity: string
  amount: string
  status: string
  created_at: string
}

export default function FarmerPayments() {
  const [payments, setPayments] = useState<Payment[]>([])

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

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Payments</Text>
        <Text className="text-gray-500 mt-1 mb-5">Live settlements from buyer orders.</Text>

        {payments.map((item) => (
          <View key={item.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <Text className="text-lg font-black text-[#2A5C43]">Payment #{item.id}</Text>
            <Text className="text-gray-700">Buyer: {item.buyer || "Unknown"}</Text>
            <Text className="text-gray-700">Order: #{item.order_id}</Text>
            <Text className="text-gray-700">Qty: {Number(item.quantity || 0).toLocaleString()} kg</Text>
            <Text className="text-gray-900 font-black mt-1">KES {Number(item.amount).toLocaleString()}</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {item.status} • {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
