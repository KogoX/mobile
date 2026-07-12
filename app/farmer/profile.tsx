import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { clearSession } from "../../lib/session"

type Profile = {
  name: string
  email: string
  role: string
  phone?: string | null
  location?: string | null
  status?: string
  created_at?: string
}

type YieldItem = {
  id: number
  quantity: string
  grade: string
}

type PaymentItem = {
  id: number
  amount: string
  status: string
}

export default function FarmerProfile() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [yields, setYields] = useState<YieldItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])

  const refresh = useCallback(async () => {
    const [profileRes, yieldRes, paymentRes] = await Promise.all([
      api.get("/auth/me"),
      api.get("/yields"),
      api.get("/payments")
    ])
    setProfile(profileRes.data)
    setYields(yieldRes.data)
    setPayments(paymentRes.data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  const stats = useMemo(() => {
    const totalYield = yields.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const verifiedPayments = payments
      .filter((item) => item.status === "Verified")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const gradeA = yields
      .filter((item) => item.grade === "A")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

    return {
      totalYield,
      verifiedPayments,
      gradeShare: totalYield ? Math.round((gradeA / totalYield) * 100) : 0
    }
  }, [payments, yields])

  async function logout() {
    await clearSession()
    router.replace("/(auth)/login")
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-3xl font-black text-[#2A5C43]">Profile</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push("/")}
              className="h-11 w-11 rounded-full bg-white border border-gray-200 items-center justify-center"
            >
              <MaterialIcons name="home" size={22} color="#2A5C43" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/farmer")}
              className="h-11 w-11 rounded-full bg-white border border-gray-200 items-center justify-center"
            >
              <MaterialIcons name="dashboard" size={22} color="#2A5C43" />
            </Pressable>
          </View>
        </View>
        <Text className="text-gray-500 mt-1 mb-5">Your live account and farm performance summary.</Text>

        <View className="bg-[#125C3F] rounded-2xl p-5 mb-4">
          <View className="h-14 w-14 rounded-full bg-white/15 items-center justify-center mb-4">
            <MaterialIcons name="person" size={30} color="#ffffff" />
          </View>
          <Text className="text-white text-2xl font-black">{profile?.name || "Farmer"}</Text>
          <Text className="text-[#D7F3E5] mt-1">{profile?.email || "Loading account..."}</Text>
          <View className="self-start bg-white/15 rounded-full px-3 py-1 mt-3">
            <Text className="text-white text-[11px] uppercase font-black">{profile?.status || "Active"}</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-4">
          <Metric label="Yield" value={`${stats.totalYield.toLocaleString()} kg`} />
          <Metric label="Paid" value={`KES ${stats.verifiedPayments.toLocaleString()}`} />
        </View>
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <Text className="text-[11px] text-gray-500 uppercase font-black">Grade A Share</Text>
          <View className="h-3 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <View className="h-3 bg-[#2A5C43] rounded-full" style={{ width: `${stats.gradeShare}%` }} />
          </View>
          <Text className="text-gray-800 font-black mt-2">{stats.gradeShare}% of logged yield</Text>
        </View>

        {profile ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
            <Row label="Phone" value={profile.phone || "Not set"} />
            <Row label="Location" value={profile.location || "Not set"} />
            <Row label="Role" value={profile.role} />
            <Row
              label="Member Since"
              value={profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Not available"}
            />
          </View>
        ) : null}

        <Pressable onPress={logout} className="rounded-xl bg-[#2A5C43] py-4 flex-row items-center justify-center gap-2">
          <MaterialIcons name="logout" size={19} color="#ffffff" />
          <Text className="text-white font-black">Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200">
      <Text className="text-[11px] text-gray-500 uppercase font-black">{label}</Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="py-3 border-b border-gray-100">
      <Text className="text-[11px] text-gray-500 uppercase font-black">{label}</Text>
      <Text className="text-gray-900 font-semibold mt-1">{value}</Text>
    </View>
  )
}
