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

export default function FarmerDashboard() {
  const [name, setName] = useState("Farmer")
  const [yields, setYields] = useState<YieldItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])

  const refresh = useCallback(async () => {
    const [yieldRes, paymentRes, user] = await Promise.all([
      api.get("/yields"),
      api.get("/payments"),
      getSessionUser()
    ])
    setYields(yieldRes.data)
    setPayments(paymentRes.data)
    if (user?.name) setName(user.name)
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

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Welcome, {name}</Text>
        <Text className="text-gray-500 mt-1 mb-5">Your live yield and payout activity.</Text>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
          <Text className="text-[11px] text-gray-500 uppercase font-bold">Total Yield Logged</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">{totalYield.toLocaleString()} kg</Text>
        </View>
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <Text className="text-[11px] text-gray-500 uppercase font-bold">Verified Payments</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">KES {totalPaid.toLocaleString()}</Text>
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-2">Recent Yields</Text>
        {yields.slice(0, 6).map((entry) => (
          <View key={entry.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <Text className="font-black text-[#2A5C43]">
              {entry.crop_season} • Grade {entry.grade}
            </Text>
            <Text className="text-gray-700">{entry.variety}</Text>
            <Text className="text-gray-800 font-bold mt-1">{Number(entry.quantity).toLocaleString()} kg</Text>
            <Text className="text-gray-500 text-sm mt-1">{new Date(entry.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
