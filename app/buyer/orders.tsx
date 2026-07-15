import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import * as WebBrowser from "expo-web-browser"

import api from "../../lib/api"
import { getSessionUser } from "../../lib/session"
import { shortHash } from "../../components/Toast"

type Order = {
  id: number
  farmer?: string | null
  yield_id?: number | null
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
  const [methodOrder, setMethodOrder] = useState<Order | null>(null)
  const [buyerPhone, setBuyerPhone] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [ordersRes, user] = await Promise.all([api.get("/orders"), getSessionUser()])
      setOrders(ordersRes.data)
      if (user?.phone) setBuyerPhone(user.phone)
    } catch (error) {
      console.warn("Failed to load orders:", error)
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

  async function startPayment(order: Order, method: "card" | "mpesa" | "bank") {
    try {
      setPayingOrderId(order.id)
      const { data } = await api.post("/payments/initialize", {
        order_id: order.id,
        method,
        phone: buyerPhone
      })

      if ((method === "card" || method === "bank") && data.authorization_url) {
        await WebBrowser.openBrowserAsync(data.authorization_url)
        await api.post("/payments/verify", { reference: data.reference })
      } else {
        Alert.alert("Payment initiated", data.message || "Complete the payment on your phone.")
        await pollVerify(data.reference)
      }
      await refresh()
    } catch (error: any) {
      Alert.alert("Payment failed", error?.response?.data?.error || error.message)
    } finally {
      setPayingOrderId(null)
      setMethodOrder(null)
    }
  }

  async function pollVerify(reference: string) {
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const { data } = await api.post("/payments/verify", { reference })
        if (data?.verified) return
      } catch (_error) {
        // keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Orders & Payments</Text>
        <Text className="text-gray-500 mt-1 mb-5">Pay securely with card or M-Pesa via Paystack.</Text>

        {isLoading && (
          <View>
            {[1, 2, 3].map((key) => (
              <View key={key} className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 opacity-70">
                <View className="h-6 w-1/3 bg-gray-200 rounded-full mb-2" />
                <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-1" />
                <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-1" />
                <View className="h-4 w-2/3 bg-gray-200 rounded-full mb-2" />
                <View className="h-5 w-1/4 bg-gray-200 rounded-full mb-2" />
                <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-4" />
                <View className="h-12 w-full bg-gray-200 rounded-xl" />
              </View>
            ))}
          </View>
        )}

        {!isLoading && orders.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-gray-400 font-black text-lg mt-4">No orders found</Text>
          </View>
        )}

        {!isLoading && orders.map((order) => {
          const isPaid = order.status === "Paid" || order.payment_status === "Verified"
          const processingPayment = payingOrderId === order.id

          return (
            <View key={order.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <Text className="text-lg font-black text-[#2A5C43]">Order #{shortHash(order.id)}</Text>
              <Text className="text-gray-700 mt-1">{order.produce}</Text>
              <Text className="text-gray-700">Qty: {Number(order.quantity).toLocaleString()} kg</Text>
              <Text className="text-gray-700">Unit Price: KES {Number(order.unit_price).toLocaleString()}</Text>
              <Text className="text-gray-700">
                Fulfillment: {order.farmer ? `${order.farmer} harvest #${order.yield_id ? shortHash(order.yield_id) : "—"}` : "Awaiting manager match"}
              </Text>
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
                  onPress={() => setMethodOrder(order)}
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

      <Modal visible={Boolean(methodOrder)} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setMethodOrder(null)}>
          <View className="bg-white rounded-t-3xl p-6" onStartShouldSetResponder={() => true}>
            <Text className="text-[#2A5C43] text-2xl font-black">Choose payment method</Text>
            <Text className="text-gray-500 mt-1 mb-5">
              Order #{methodOrder ? shortHash(methodOrder.id) : ""} • KES {Number(methodOrder?.total_amount || 0).toLocaleString()}
            </Text>

            <Pressable
              className="bg-[#2A5C43] rounded-xl py-4 items-center mb-3"
              onPress={() => methodOrder && startPayment(methodOrder, "card")}
            >
              <Text className="text-white font-black">Pay with Card</Text>
            </Pressable>

            <Pressable
              className="bg-[#1e4d35] rounded-xl py-4 items-center mb-3"
              onPress={() => methodOrder && startPayment(methodOrder, "bank")}
            >
              <Text className="text-white font-black">Pay with Bank Transfer</Text>
            </Pressable>

            <Pressable
              className="bg-[#125C3F] rounded-xl py-4 items-center"
              onPress={() => methodOrder && startPayment(methodOrder, "mpesa")}
            >
              <Text className="text-white font-black">Pay with M-Pesa</Text>
            </Pressable>

            <Pressable className="mt-4 items-center py-2" onPress={() => setMethodOrder(null)}>
              <Text className="text-gray-500 font-bold">Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
