import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

type FarmerSummary = {
  id: string
  name: string
  location: string | null
  status: string
  total_yield_kg: string
}

type User = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  location?: string | null
  status: string
  created_at: string
}

type Farmer = FarmerSummary & {
  email?: string
  phone?: string | null
  created_at?: string
}

export default function ManagerFarmers() {
  const [farmers, setFarmers] = useState<FarmerSummary[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState("")

  const refresh = useCallback(async () => {
    const [farmersRes, usersRes] = await Promise.all([api.get("/farmers"), api.get("/auth/users")])
    setFarmers(farmersRes.data)
    setUsers(usersRes.data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  const rows = useMemo(() => {
    const userMap = new Map(users.filter((user) => user.role === "farmer").map((user) => [user.id, user]))
    return farmers.map((farmer) => {
      const user = userMap.get(farmer.id)
      return {
        ...farmer,
        email: user?.email,
        phone: user?.phone,
        created_at: user?.created_at,
        status: user?.status || farmer.status
      }
    })
  }, [farmers, users])

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((farmer) =>
      [farmer.name, farmer.email, farmer.phone, farmer.location, farmer.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    )
  }, [query, rows])

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((farmer) => farmer.status === "Pending").length,
      suspended: rows.filter((farmer) => farmer.status === "Suspended").length,
      totalYield: rows.reduce((sum, farmer) => sum + Number(farmer.total_yield_kg || 0), 0)
    }),
    [rows]
  )

  async function updateStatus(id: string, status: string) {
    await api.patch(`/auth/users/${id}/status`, { status })
    refresh()
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Farmer Registry</Text>
        <Text className="text-gray-500 mt-1 mb-5">Verify farmers and monitor harvest supply entering the export flow.</Text>

        <View className="flex-row flex-wrap gap-3 mb-4">
          <Metric label="Farmers" value={stats.total.toLocaleString()} icon="groups" />
          <Metric label="Pending" value={stats.pending.toLocaleString()} icon="pending-actions" />
          <Metric label="Suspended" value={stats.suspended.toLocaleString()} icon="block" />
          <Metric label="Yield Logged" value={`${stats.totalYield.toLocaleString()} kg`} icon="eco" />
        </View>

        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-4">
          <MaterialIcons name="search" size={20} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search farmers, contacts, regions..."
            placeholderTextColor="#9ca3af"
            className="flex-1 min-h-[48px] ml-2 text-gray-800"
            style={{ outlineStyle: "none" } as never}
          />
        </View>

        {filteredRows.map((farmer) => (
          <View key={farmer.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-black text-[#2A5C43]">{farmer.name}</Text>
                <Text className="text-gray-700 mt-1">{farmer.location || "No location set"}</Text>
                <Text className="text-gray-500 mt-1">{farmer.email || "No email"}</Text>
              </View>
              <StatusPill status={farmer.status} />
            </View>
            <Text className="text-gray-900 font-black mt-3">
              Yield: {Number(farmer.total_yield_kg || 0).toLocaleString()} kg
            </Text>
            <Text className="text-gray-500 mt-1">
              Joined {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : "date unavailable"}
            </Text>

            <View className="flex-row gap-2 mt-4">
              <Action label="Verify" onPress={() => updateStatus(farmer.id, "Active")} />
              <Action label="Review" tone="neutral" onPress={() => updateStatus(farmer.id, "Pending")} />
              <Action label="Suspend" tone="danger" onPress={() => updateStatus(farmer.id, "Suspended")} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 min-h-[110px] flex-1 min-w-[150px]">
      <MaterialIcons name={icon} size={21} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">{label}</Text>
      <Text className="text-[#2A5C43] text-xl font-black mt-1">{value}</Text>
    </View>
  )
}

function StatusPill({ status }: { status: string }) {
  const danger = status === "Suspended"
  const pending = status === "Pending"
  return (
    <View className={`rounded-full px-3 py-1 ${danger ? "bg-red-100" : pending ? "bg-amber-100" : "bg-[#E7F5EE]"}`}>
      <Text className={`text-[11px] font-black uppercase ${danger ? "text-red-700" : pending ? "text-amber-700" : "text-[#2A5C43]"}`}>
        {status}
      </Text>
    </View>
  )
}

function Action({
  label,
  onPress,
  tone = "primary"
}: {
  label: string
  onPress: () => void
  tone?: "primary" | "neutral" | "danger"
}) {
  const classes =
    tone === "primary"
      ? "bg-[#2A5C43]"
      : tone === "danger"
        ? "bg-white border border-red-300"
        : "bg-white border border-gray-200"
  const text = tone === "primary" ? "text-white" : tone === "danger" ? "text-red-600" : "text-gray-700"
  return (
    <Pressable onPress={onPress} className={`flex-1 rounded-xl py-3 items-center ${classes}`}>
      <Text className={`font-black ${text}`}>{label}</Text>
    </Pressable>
  )
}
