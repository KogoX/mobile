import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

type Farmer = {
  id: string
  name: string
  location: string | null
  status: string
  total_yield_kg: string
}

export default function ManagerFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([])

  const refresh = useCallback(async () => {
    const { data } = await api.get("/farmers")
    setFarmers(data)
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
        <Text className="text-3xl font-black text-[#2A5C43]">Farmers</Text>
        <Text className="text-gray-500 mt-1 mb-5">All registered farmers from the live database.</Text>

        {farmers.map((farmer) => (
          <View key={farmer.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <Text className="text-lg font-black text-[#2A5C43]">{farmer.name}</Text>
            <Text className="text-gray-700">{farmer.location || "No location set"}</Text>
            <Text className="text-gray-700 mt-1">Status: {farmer.status}</Text>
            <Text className="text-gray-900 font-bold mt-1">
              Yield: {Number(farmer.total_yield_kg || 0).toLocaleString()} kg
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
