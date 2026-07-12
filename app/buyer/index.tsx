import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

type Farmer = {
  id: string
  name: string
  location: string | null
  total_yield_kg: string
}

export default function BuyerDashboard() {
  const router = useRouter()
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("1200")
  const [creating, setCreating] = useState(false)

  const totalAvailable = useMemo(
    () => farmers.reduce((sum, item) => sum + Number(item.total_yield_kg || 0), 0),
    [farmers]
  )

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

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createOrder() {
    if (!quantity) {
      Alert.alert("Missing quantity", "Enter order quantity in kg.")
      return
    }

    try {
      setCreating(true)
      await api.post("/orders", {
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        produce: "Avocado (Hass)"
      })
      setQuantity("")
      Alert.alert("Order created", "Order was saved. You can pay for it from Orders.")
      router.push("/buyer/orders")
    } catch (error: any) {
      Alert.alert("Unable to create order", error?.response?.data?.error || error.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Buyer Dashboard</Text>
        <Text className="text-gray-500 mt-1 mb-5">Live cooperative supply and instant ordering.</Text>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-5">
          <Text className="text-lg font-black text-[#2A5C43] mb-2">Create Order</Text>
          <Text className="text-gray-500 text-sm mb-3">Orders are stored immediately in the database.</Text>
          <Field label="Quantity (kg)" value={quantity} onChangeText={setQuantity} />
          <Field label="Unit Price (KES/kg)" value={unitPrice} onChangeText={setUnitPrice} />
          <Pressable
            onPress={createOrder}
            disabled={creating}
            className={`rounded-xl py-3 items-center mt-2 ${creating ? "bg-[#6d9a86]" : "bg-[#2A5C43]"}`}
          >
            <Text className="text-white font-black">{creating ? "Creating..." : "Create Order"}</Text>
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
          <Text className="text-sm text-gray-500 uppercase">Total available farmer yield</Text>
          <Text className="text-3xl font-black text-[#2A5C43]">{totalAvailable.toLocaleString()} kg</Text>
        </View>

        {farmers.map((farmer) => (
          <View key={farmer.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <Text className="text-lg font-black text-[#2A5C43]">{farmer.name}</Text>
            <Text className="text-gray-500">{farmer.location || "Location not set"}</Text>
            <Text className="text-gray-800 mt-2 font-bold">
              Yield logged: {Number(farmer.total_yield_kg || 0).toLocaleString()} kg
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label,
  value,
  onChangeText
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
}) {
  return (
    <View className="mb-3">
      <Text className="text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        className="min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-800"
        style={{ outlineStyle: "none" } as never}
      />
    </View>
  )
}
