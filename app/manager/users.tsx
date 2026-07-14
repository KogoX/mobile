import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import type { Role } from "../../lib/session"

type User = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: Role
  location?: string | null
  status: string
  created_at: string
  unique_id?: string | null
}

const filters: Array<Role | "all"> = ["all", "farmer", "buyer", "manager"]

export default function ManagerUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [activeFilter, setActiveFilter] = useState<Role | "all">("all")

  const refresh = useCallback(async () => {
    const { data } = await api.get("/auth/users")
    setUsers(data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  const filteredUsers = useMemo(
    () => (activeFilter === "all" ? users : users.filter((user) => user.role === activeFilter)),
    [activeFilter, users]
  )

  const counts = useMemo(
    () =>
      users.reduce<Record<string, number>>(
        (total, user) => {
          total.all += 1
          total[user.role] = (total[user.role] || 0) + 1
          return total
        },
        { all: 0, farmer: 0, buyer: 0, manager: 0 }
      ),
    [users]
  )

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Users</Text>
        <Text className="text-gray-500 mt-1 mb-5">Registered accounts stored in the live database.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 ${active ? "bg-[#2A5C43]" : "bg-white border border-gray-200"}`}
                >
                  <Text className={active ? "text-white font-black" : "text-gray-700 font-black"}>
                    {labelFor(filter)} ({counts[filter] || 0})
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>

        {filteredUsers.length ? (
          filteredUsers.map((user) => (
            <View key={user.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-black text-[#2A5C43]">{user.name}</Text>
                  <Text className="text-gray-700 mt-1">{user.email}</Text>
                </View>
                <View className="bg-[#E7F5EE] rounded-full px-3 py-1">
                  <Text className="text-[#2A5C43] text-[11px] font-black uppercase">{user.role}</Text>
                </View>
              </View>

              <View className="mt-3 gap-1">
                {user.unique_id ? <Detail icon="fingerprint" value={`ID: ${user.unique_id}`} /> : null}
                <Detail icon="phone" value={user.phone || "No phone set"} />
                <Detail icon="location-on" value={user.location || "No location set"} />
                <Detail icon="verified-user" value={user.status || "Active"} />
                <Detail icon="event" value={`Joined ${new Date(user.created_at).toLocaleDateString()}`} />
              </View>
            </View>
          ))
        ) : (
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="font-black text-[#2A5C43]">No users found</Text>
            <Text className="text-gray-500 mt-1">New registered users will appear here automatically.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Detail({ icon, value }: { icon: keyof typeof MaterialIcons.glyphMap; value: string }) {
  return (
    <View className="flex-row items-center">
      <MaterialIcons name={icon} size={16} color="#6b7280" />
      <Text className="text-gray-700 ml-2">{value}</Text>
    </View>
  )
}

function labelFor(value: Role | "all") {
  return value[0].toUpperCase() + value.slice(1)
}
