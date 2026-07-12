import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { Alert, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

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

export default function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null)

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

  async function pay(order: Order) {
    try {
      setPayingOrderId(order.id)
      await api.post("/payments", {
        order_id: order.id,
        amount: Number(order.total_amount || 0)
      })
      await refresh()
    } catch (error: any) {
      Alert.alert("Payment failed", error?.response?.data?.error || error.message)
    } finally {
      setPayingOrderId(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Orders & Payments</Text>
        <Text className="text-gray-500 mt-1 mb-5">Real-time order status and payment flow.</Text>

        {orders.map((order) => {
          const isPaid = order.status === "Paid" || order.payment_status === "Verified"
          const processingPayment = payingOrderId === order.id

          return (
            <View key={order.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <Text className="text-lg font-black text-[#2A5C43]">Order #{order.id}</Text>
              <Text className="text-gray-700 mt-1">{order.produce}</Text>
              <Text className="text-gray-700">Qty: {Number(order.quantity).toLocaleString()} kg</Text>
              <Text className="text-gray-700">Unit Price: KES {Number(order.unit_price).toLocaleString()}</Text>
              <Text className="text-gray-900 font-bold mt-1">
                Total: KES {Number(order.total_amount).toLocaleString()}
              </Text>
              <Text className="text-sm mt-1 text-gray-500">
                Status: {isPaid ? "Paid" : order.status} •{" "}
                {new Date(order.created_at).toLocaleString()}
              </Text>

              {!isPaid && (
                <Pressable
                  className={`mt-3 rounded-xl py-3 items-center ${processingPayment ? "bg-[#6d9a86]" : "bg-[#2A5C43]"}`}
                  onPress={() => pay(order)}
                  disabled={processingPayment}
                >
                  <Text className="text-white font-black">
                    {processingPayment ? "Processing..." : "Pay now"}
                  </Text>
                </Pressable>
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
