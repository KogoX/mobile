import { useFocusEffect, useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useState } from "react"
import { Alert, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import {
  canUseBiometrics,
  clearSession,
  disableBiometricSignIn,
  enableBiometricSignIn,
  isBiometricSignInEnabled,
  type SessionUser
} from "../../lib/session"

type Profile = {
  name: string
  email: string
  role: string
  phone?: string | null
  location?: string | null
  status?: string
  unique_id?: string | null
}

export default function ManagerSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  const refresh = useCallback(async () => {
    const { data } = await api.get("/auth/me")
    setProfile(data)
    setBiometricEnabled(await isBiometricSignInEnabled())
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  async function logout() {
    await clearSession()
    router.replace("/(auth)/login")
  }

  async function toggleBiometrics() {
    try {
      if (biometricEnabled) {
        await disableBiometricSignIn()
        setBiometricEnabled(false)
        return
      }

      if (!profile) return

      const available = await canUseBiometrics()
      if (!available) {
        Alert.alert("Biometrics unavailable", "Add a fingerprint or face unlock on this phone first.")
        return
      }

      const token = await AsyncStorage.getItem("token")
      if (!token) {
        Alert.alert("Sign in again", "Please sign in with your password before enabling biometrics.")
        return
      }

      await enableBiometricSignIn(token, profile as SessionUser)
      setBiometricEnabled(true)
    } catch (error: any) {
      Alert.alert("Biometric setup failed", error.message)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Profile Settings</Text>
        <Text className="text-gray-500 mt-1 mb-5">Account details from live user profile.</Text>

        {profile ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
            <Row label="Unique ID" value={profile.unique_id || "Not set"} />
            <Row label="Name" value={profile.name} />
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role} />
            <Row label="Phone" value={profile.phone || "Not set"} />
            <Row label="Location" value={profile.location || "Not set"} />
            <Row label="Status" value={profile.status || "Active"} />
          </View>
        ) : null}

        <Pressable
          onPress={toggleBiometrics}
          className="rounded-xl bg-white border border-gray-200 py-4 flex-row items-center justify-center gap-2 mb-3"
        >
          <MaterialIcons name="fingerprint" size={20} color="#2A5C43" />
          <Text className="text-[#2A5C43] font-black">
            {biometricEnabled ? "Disable biometric sign in" : "Enable biometric sign in"}
          </Text>
        </Pressable>

        <Pressable onPress={logout} className="rounded-xl bg-[#2A5C43] py-3 items-center">
          <Text className="text-white font-black">Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="py-2 border-b border-gray-100">
      <Text className="text-[11px] text-gray-500 uppercase font-bold">{label}</Text>
      <Text className="text-gray-900 font-semibold mt-1">{value}</Text>
    </View>
  )
}
