import { useFocusEffect, useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useState } from "react"
import { Alert, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from "react-native"
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

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    const { data } = await api.get("/auth/me")
    setProfile(data)
    setBiometricEnabled(await isBiometricSignInEnabled())
  }, [])

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

  function startEditing() {
    if (!profile) return
    setEditName(profile.name || "")
    setEditPhone(profile.phone || "")
    setEditLocation(profile.location || "")
    setEditing(true)
  }

  function cancelEditing() { setEditing(false) }

  async function saveProfile() {
    if (!editName.trim()) {
      Alert.alert("Validation", "Name cannot be empty.")
      return
    }
    setSaving(true)
    try {
      const { data } = await api.patch("/auth/me", {
        name: editName.trim(),
        phone: editPhone.trim(),
        location: editLocation.trim()
      })
      setProfile(data)
      setEditing(false)
    } catch (err: any) {
      Alert.alert("Save failed", err?.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-3xl font-black text-[#2A5C43]">Profile Settings</Text>
          {!editing && (
            <Pressable
              onPress={startEditing}
              className="h-11 w-11 rounded-full bg-white border border-gray-200 items-center justify-center"
            >
              <MaterialIcons name="edit" size={20} color="#2A5C43" />
            </Pressable>
          )}
        </View>
        <Text className="text-gray-500 mt-1 mb-5">Account details from live user profile.</Text>

        {/* Hero card */}
        {profile ? (
          <View className="bg-[#125C3F] rounded-2xl p-5 mb-4">
            <View className="h-14 w-14 rounded-full bg-white/15 items-center justify-center mb-4">
              <MaterialIcons name="manage-accounts" size={30} color="#ffffff" />
            </View>
            <Text className="text-white text-2xl font-black">{profile.name}</Text>
            <Text className="text-[#D7F3E5] mt-1">{profile.email}</Text>
            {profile.unique_id ? (
              <Text className="text-[#D7F3E5] mt-1 font-bold">ID: {profile.unique_id}</Text>
            ) : null}
            <View className="self-start bg-white/15 rounded-full px-3 py-1 mt-3">
              <Text className="text-white text-[11px] uppercase font-black">{profile.status || "Active"}</Text>
            </View>
          </View>
        ) : null}

        {/* Details / Edit */}
        {profile ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[11px] text-gray-500 uppercase font-black">Account Details</Text>
              {editing && <Text className="text-xs text-[#2A5C43] font-bold">Editing</Text>}
            </View>

            <Row label="Unique ID" value={profile.unique_id || "Not set"} />
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role} />
            <Row label="Status" value={profile.status || "Active"} />

            {editing ? (
              <>
                <EditField label="Name" value={editName} onChangeText={setEditName} icon="person-outline" />
                <EditField label="Phone" value={editPhone} onChangeText={setEditPhone} icon="phone" keyboardType="phone-pad" />
                <EditField label="Location" value={editLocation} onChangeText={setEditLocation} icon="location-on" />

                <View className="flex-row gap-3 mt-4">
                  <Pressable
                    onPress={cancelEditing}
                    className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-600 font-bold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={saveProfile}
                    disabled={saving}
                    className={`flex-1 rounded-xl py-3 items-center flex-row justify-center gap-2 ${saving ? "bg-[#53866f]" : "bg-[#2A5C43]"}`}
                  >
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                    <Text className="text-white font-bold">{saving ? "Saving..." : "Save"}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Row label="Name" value={profile.name} />
                <Row label="Phone" value={profile.phone || "Not set"} />
                <Row label="Location" value={profile.location || "Not set"} />
              </>
            )}
          </View>
        ) : null}

        {/* Biometrics */}
        <Pressable
          onPress={toggleBiometrics}
          className="rounded-xl bg-white border border-gray-200 py-4 flex-row items-center justify-center gap-2 mb-3"
        >
          <MaterialIcons name="fingerprint" size={20} color="#2A5C43" />
          <Text className="text-[#2A5C43] font-black">
            {biometricEnabled ? "Disable biometric sign in" : "Enable biometric sign in"}
          </Text>
        </Pressable>

        <Pressable onPress={logout} className="rounded-xl bg-[#2A5C43] py-4 flex-row items-center justify-center gap-2">
          <MaterialIcons name="logout" size={19} color="#ffffff" />
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

function EditField({
  label, value, onChangeText, icon, keyboardType
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  icon: keyof typeof MaterialIcons.glyphMap
  keyboardType?: "default" | "phone-pad" | "email-address"
}) {
  return (
    <View className="mb-3 mt-1">
      <Text className="text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</Text>
      <View className="flex-row items-center bg-gray-50 border border-[#2A5C43] rounded-xl px-3">
        <MaterialIcons name={icon} size={18} color="#2A5C43" />
        <TextInput
          className="flex-1 min-h-[44px] ml-2 text-gray-800"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "phone-pad" ? "none" : "words"}
          style={{ outlineStyle: "none" } as never}
        />
      </View>
    </View>
  )
}
