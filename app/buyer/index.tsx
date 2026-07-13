import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Image } from "expo-image"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { notifyNewListing } from "../../lib/notifications"

type Listing = {
  id: string
  farmer: string
  crop_season: string
  variety: string
  quantity: string
  grade: string
  status: string
  photos: string[]
  created_at: string
}

const listingCountKey = "buyerListingCount"

export default function BuyerDashboard() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [region, setRegion] = useState("All Regions")
  const [grade, setGrade] = useState("All Grades")
  const [quantity, setQuantity] = useState("50")
  const [creatingId, setCreatingId] = useState<string | null>(null)

  const approvedListings = useMemo(
    () =>
      listings.filter((item) =>
        ["Approved", "Scheduled", "Exported"].includes(item.status)
          && (grade === "All Grades" || item.grade === grade)
      ),
    [grade, listings]
  )

  const totalAvailable = useMemo(
    () => approvedListings.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [approvedListings]
  )

  const refresh = useCallback(async () => {
    const { data } = await api.get("/yields")
    const nextListings = data as Listing[]
    const visible = nextListings.filter((item) => ["Approved", "Scheduled", "Exported"].includes(item.status))
    const previousRaw = await AsyncStorage.getItem(listingCountKey)
    const previousCount = previousRaw ? Number(previousRaw) : visible.length

    if (visible.length > previousCount) {
      await notifyNewListing("New avocado listing", `${visible.length - previousCount} fresh harvest listing(s) are available.`)
    }

    await AsyncStorage.setItem(listingCountKey, String(visible.length))
    setListings(nextListings)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  async function createOrder(listing: Listing) {
    const requested = Number(quantity || 0)
    if (!requested) {
      Alert.alert("Missing quantity", "Enter order quantity in kg.")
      return
    }

    if (requested > Number(listing.quantity || 0)) {
      Alert.alert("Quantity too high", "Choose a quantity within the available listing volume.")
      return
    }

    try {
      setCreatingId(listing.id)
      await api.post("/orders", {
        quantity: requested,
        unitPrice: 1200,
        produce: listing.variety
      })
      Alert.alert("Order created", "Your order was saved. A manager will match it to the harvest.")
      router.push("/buyer/orders")
    } catch (error: any) {
      Alert.alert("Unable to create order", error?.response?.data?.error || error.message)
    } finally {
      setCreatingId(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Available Avocado Listings</Text>
        <Text className="text-gray-500 mt-1 mb-5">Premium Hass and Fuerte avocados ready for export.</Text>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-5">
          <Filter label="Region" value={region} onPress={() => setRegion(region === "All Regions" ? "Nyeri, Central Kenya" : "All Regions")} />
          <Filter label="Grade" value={grade} onPress={() => setGrade(grade === "All Grades" ? "A" : "All Grades")} />
          <Text className="text-[11px] text-gray-500 uppercase font-black mb-1">Quantity (kg)</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            className="min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-800 mb-3"
            style={{ outlineStyle: "none" } as never}
          />
          <View className="rounded-xl bg-[#E7F5EE] p-3">
            <Text className="text-[#2A5C43] font-black">{totalAvailable.toLocaleString()} kg available</Text>
          </View>
        </View>

        {approvedListings.map((listing, index) => (
          <View key={listing.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4 ${index === 0 ? "bg-[#125C3F]" : ""}`}>
            {listing.photos?.[0] ? (
              <Image source={{ uri: listing.photos[0] }} style={{ width: "100%", height: 190 }} contentFit="cover" />
            ) : (
              <View className="h-[150px] bg-[#E7F5EE] items-center justify-center">
                <MaterialIcons name="eco" size={42} color="#2A5C43" />
              </View>
            )}
            <View className={index === 0 ? "p-5 bg-[#125C3F]" : "p-4"}>
              <View className="self-start rounded-full bg-[#BDF264] px-3 py-1 mb-3">
                <Text className="text-[#125C3F] text-[10px] font-black uppercase">{listing.grade === "A" ? "Premium harvest" : `Grade ${listing.grade}`}</Text>
              </View>
              <Text className={`text-xl font-black ${index === 0 ? "text-white" : "text-[#2A5C43]"}`}>{listing.farmer || "Cooperative Harvest"}</Text>
              <Text className={index === 0 ? "text-[#D7F3E5] mt-1" : "text-gray-500 mt-1"}>{listing.variety}</Text>
              <View className="flex-row gap-3 mt-4">
                <Info label="Grade" value={listing.grade} highlight={index === 0} />
                <Info label="Available" value={`${Number(listing.quantity || 0).toLocaleString()} kg`} highlight={index === 0} />
              </View>
              <View className="flex-row gap-3 mt-3">
                <Info label="Harvest" value={new Date(listing.created_at).toLocaleDateString()} highlight={index === 0} />
                <Info label="Price" value="KES 1,200/kg" highlight={index === 0} />
              </View>
              <Pressable
                onPress={() => createOrder(listing)}
                disabled={creatingId === listing.id}
                className={`mt-5 rounded-full py-3 items-center ${index === 0 ? "bg-white" : "border border-[#2A5C43]"}`}
              >
                <Text className={`font-black ${index === 0 ? "text-[#125C3F]" : "text-[#2A5C43]"}`}>
                  {creatingId === listing.id ? "Creating..." : "Place Order Now"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function Filter({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-3">
      <Text className="text-[11px] text-gray-500 uppercase font-black mb-1">{label}</Text>
      <View className="min-h-[44px] rounded-xl bg-gray-50 border border-gray-200 px-3 flex-row items-center justify-between">
        <Text className="text-gray-700 font-semibold">{value}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color="#6b7280" />
      </View>
    </Pressable>
  )
}

function Info({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <View className="flex-1">
      <Text className={`text-[10px] uppercase font-black ${highlight ? "text-[#BDF264]" : "text-gray-500"}`}>{label}</Text>
      <Text className={`font-black mt-1 ${highlight ? "text-white" : "text-[#2A5C43]"}`}>{value}</Text>
    </View>
  )
}
