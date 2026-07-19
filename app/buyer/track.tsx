import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"

import api from "../../lib/api"
import { shortHash } from "../../components/Toast"

type Order = {
  id: number
  farmer?: string | null
  yield_id?: number | null
  quantity: string
  produce: string
  status: string
  payment_status: string | null
  tracking_location?: string
  estimated_delivery?: string
  created_at: string
}

export default function BuyerTrack() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/orders")
      // Only show orders that are paid but not fulfilled
      const trackable = data.filter((o: Order) => 
        (o.status !== "Pending" && o.status !== "Cancelled" && o.status !== "Approved" && o.status !== "Fulfilled") || o.payment_status === "Verified"
      )
      setOrders(trackable)
    } catch (error) {
      console.warn("Failed to load tracking orders:", error)
    } finally {
      setIsLoading(false)
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
        <Text className="text-3xl font-black text-[#2A5C43]">Track Shipments</Text>
        <Text className="text-gray-500 mt-1 mb-5">Monitor your active produce orders in real-time.</Text>

        {isLoading && (
          <View>
            {[1, 2].map((key) => (
              <View key={key} className="bg-white rounded-2xl p-6 border border-gray-100 mb-4 opacity-70">
                <View className="h-6 w-1/3 bg-gray-200 rounded-full mb-6" />
                <View className="flex-row gap-4">
                  <View className="items-center">
                    <View className="w-4 h-4 rounded-full bg-gray-200" />
                    <View className="w-1 h-12 bg-gray-200 -mt-1" />
                    <View className="w-4 h-4 rounded-full bg-gray-200" />
                  </View>
                  <View className="flex-1">
                    <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-8" />
                    <View className="h-4 w-1/2 bg-gray-200 rounded-full" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!isLoading && orders.length === 0 && (
          <View className="items-center py-16">
            <MaterialIcons name="local-shipping" size={48} color="#d1d5db" />
            <Text className="text-gray-400 font-black text-lg mt-4">No active shipments</Text>
            <Text className="text-gray-400 text-center mt-2 px-8">When you pay for an order, you can track its journey here.</Text>
          </View>
        )}

        {!isLoading && orders.map((order) => {
          return (
            <View key={order.id} className="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-lg font-black text-[#2A5C43]">{order.produce}</Text>
                  <Text className="text-gray-500 font-bold text-sm">Order #{shortHash(order.id)}</Text>
                </View>
                <View className="bg-[#e8f3ee] px-3 py-1 rounded-full">
                  <Text className="text-[#2A5C43] font-bold text-xs">{Number(order.quantity).toLocaleString()} kg</Text>
                </View>
              </View>

              <View className="pl-2">
                {[
                  { label: "Paid", active: true },
                  { label: "Picked Up", active: ["Picked Up", "In Transit", "Ready for Pickup", "Fulfilled"].includes(order.status) },
                  { label: "In Transit", active: ["In Transit", "Ready for Pickup", "Fulfilled"].includes(order.status) },
                  { label: "Ready for Pickup", active: ["Ready for Pickup", "Fulfilled"].includes(order.status) }
                ].map((step, index, arr) => (
                  <View key={step.label} className="flex-row">
                    <View className="items-center mr-4">
                      <View className={`w-4 h-4 rounded-full ${step.active ? "bg-[#2A5C43]" : "bg-gray-300 border-2 border-white"} z-10`} />
                      {index < arr.length - 1 && (
                        <View className={`w-1 h-12 ${arr[index + 1].active ? "bg-[#2A5C43]" : "bg-gray-200"} -mt-1`} />
                      )}
                    </View>
                    <View className="pt-0 flex-1">
                      <Text className={`font-black ${step.active ? "text-[#2A5C43]" : "text-gray-400"}`}>{step.label}</Text>
                      {step.label === "In Transit" && step.active && order.tracking_location ? (
                        <Text className="text-sm text-gray-500 mt-1">📍 {order.tracking_location}</Text>
                      ) : null}
                      {step.label === "In Transit" && step.active && order.estimated_delivery ? (
                        <Text className="text-sm text-gray-500">Est. Delivery: {new Date(order.estimated_delivery).toLocaleDateString()}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
