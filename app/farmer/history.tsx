import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { shortHash } from "../../components/Toast"

type YieldItem = {
  id: string
  crop_season: string
  variety: string
  quantity: string
  grade: string
  status: string
  created_at: string
}

export default function FarmerHistory() {
  const [yields, setYields] = useState<YieldItem[]>([])

  const refresh = useCallback(async () => {
    const { data } = await api.get("/yields")
    setYields(data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Upload History</Text>
        <Text className="text-gray-500 mt-1 mb-5">All your historical harvest records and their status.</Text>

        {yields.length ? (
          yields.map((entry) => (
            <View key={entry.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-2">
                  <Text className="font-black text-[#2A5C43]">
                    #{shortHash(entry.id)} • {entry.crop_season}
                  </Text>
                  <Text className="text-gray-700 mt-1">{entry.variety} - Grade {entry.grade}</Text>
                </View>
                <View className="bg-[#E7F5EE] rounded-full px-3 py-1">
                  <Text className="text-[#2A5C43] text-[11px] font-black uppercase">{entry.status || "Logged"}</Text>
                </View>
              </View>
              <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                <Text className="text-gray-900 font-black text-base">{Number(entry.quantity).toLocaleString()} kg</Text>
                <Text className="text-gray-400 text-xs">{new Date(entry.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        ) : (
          <View className="items-center py-10 bg-white rounded-2xl border border-gray-200">
            <MaterialIcons name="history" size={48} color="#d1d5db" />
            <Text className="text-gray-400 font-black text-lg mt-4">No history found</Text>
            <Text className="text-gray-400 text-center mt-1">You haven't uploaded any yields yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
