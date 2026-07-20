import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { shortHash } from "../../components/Toast"

type Payout = {
  id: number
  order_id: number | null
  amount: string
  method: string
  status: string
  reference: string
  notes: string | null
  created_at: string
}

export default function FarmerPayments() {
  const [payouts, setPayouts] = useState<Payout[]>([])

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/payouts")
      setPayouts(data)
    } catch (err) {
      console.log("Failed to refresh payouts:", err)
    }
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
        <Text className="text-3xl font-black text-[#2A5C43]">Payouts</Text>
        <Text className="text-gray-500 mt-1 mb-5">Your settlements and disbursements.</Text>

        {payouts.length ? (
          payouts.map((item) => (
            <View key={item.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-black text-[#2A5C43]">Payout #{item.id}</Text>
                <View className={`rounded-full px-3 py-1 ${item.status === 'Paid' ? 'bg-[#E7F5EE]' : item.status === 'Processing' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                   <Text className={`text-[11px] font-black uppercase ${item.status === 'Paid' ? 'text-[#2A5C43]' : item.status === 'Processing' ? 'text-amber-700' : 'text-gray-600'}`}>{item.status}</Text>
                </View>
              </View>
              <Text className="text-gray-700 mt-1">Method: {item.method}</Text>
              {item.order_id && <Text className="text-gray-700">Order: #{item.order_id}</Text>}
              <Text className="text-gray-900 font-black mt-1">KES {Number(item.amount).toLocaleString()}</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Ref: {shortHash(item.reference)} • {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
             <Text className="text-[#2A5C43] font-black">No payouts yet</Text>
             <Text className="text-gray-500 mt-1">Your disbursements will appear here once processed.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
