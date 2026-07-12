import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { ScrollView, Text, View } from "react-native"
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
  created_at: string
}

export default function ManagerOrders() {
  const [items, setItems] = useState<YieldItem[]>([])

  const refresh = useCallback(async () => {
    const { data } = await api.get("/yields")
    setItems(data)
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
        <Text className="text-3xl font-black text-[#2A5C43]">Yields / Orders</Text>
        <Text className="text-gray-500 mt-1 mb-5">Recent harvest records connected to order flow.</Text>

        {items.map((row) => (
          <View key={row.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <Text className="text-lg font-black text-[#2A5C43]">Yield #{row.id}</Text>
            <Text className="text-gray-700">{row.farmer || "Farmer"} • {row.crop_season}</Text>
            <Text className="text-gray-700">{row.variety} • Grade {row.grade}</Text>
            <Text className="text-gray-900 font-bold mt-1">{Number(row.quantity).toLocaleString()} kg</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {row.status} • {new Date(row.created_at).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
