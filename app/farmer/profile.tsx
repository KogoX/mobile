import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useMemo, useState } from "react"
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
import LanguageSelector from "../../components/LanguageSelector"

type Profile = {
  name: string
  email: string
  role: string
  phone?: string | null
  location?: string | null
  status?: string
  created_at?: string
  unique_id?: string | null
  payment_details?: string | null
}

type YieldItem = { id: number; quantity: string; grade: string }
type PaymentItem = { id: number; amount: string; status: string }
type Manager = { id: string; name: string; email: string; phone?: string | null; unique_id?: string | null; verified: boolean }

export default function FarmerProfile() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [yields, setYields] = useState<YieldItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [manager, setManager] = useState<Manager | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editPaymentDetails, setEditPaymentDetails] = useState("")
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteMode, setDeleteMode] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState("")

  const refresh = useCallback(async () => {
    const [profileRes, yieldRes, paymentRes] = await Promise.all([
      api.get("/auth/me"),
      api.get("/yields"),
      api.get("/payments")
    ])
    setProfile(profileRes.data)
    setYields(yieldRes.data)
    setPayments(paymentRes.data)
    setBiometricEnabled(await isBiometricSignInEnabled())
    // Load verified managers
    try {
      const mgrsRes = await api.get("/auth/managers/verified")
      setManager((mgrsRes.data as Manager[])[0] || null)
    } catch {
      setManager(null)
    }
  }, [])

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

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

  function startEditing() {
    if (!profile) return
    setEditName(profile.name || "")
    setEditPhone(profile.phone || "")
    setEditLocation(profile.location || "")
    setEditPaymentDetails(profile.payment_details || "")
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

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
        location: editLocation.trim(),
        payment_details: editPaymentDetails.trim()
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
    router.replace("/")
  }

  async function handleDelete() {
    const requiredId = profile?.unique_id || profile?.email
    if (!deleteConfirmId || deleteConfirmId.trim() !== requiredId) {
      Alert.alert("Validation Failed", "The confirmation ID you entered does not match.")
      return
    }
    try {
      await api.delete("/auth/me")
      await clearSession()
      router.replace("/")
    } catch (err: any) {
      Alert.alert("Delete failed", err?.response?.data?.error || err.message)
    }
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
          <Text className="text-3xl font-black text-[#2A5C43]">Profile</Text>
          <LanguageSelector color="#6b7280" />
          <View className="flex-row gap-2">
            {!editing && (
              <Pressable
                onPress={startEditing}
                className="h-11 w-11 rounded-full bg-white border border-gray-200 items-center justify-center"
              >
                <MaterialIcons name="edit" size={20} color="#2A5C43" />
              </Pressable>
            )}
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

        {/* Hero card */}
        <View className="bg-[#125C3F] rounded-2xl p-5 mb-4">
          <View className="h-14 w-14 rounded-full bg-white/15 items-center justify-center mb-4">
            <MaterialIcons name="person" size={30} color="#ffffff" />
          </View>
          <Text className="text-white text-2xl font-black">{profile?.name || "Farmer"}</Text>
          <Text className="text-[#D7F3E5] mt-1">{profile?.email || "Loading account..."}</Text>
          {profile?.unique_id ? (
            <Text className="text-[#D7F3E5] mt-1 font-bold">ID: {profile.unique_id}</Text>
          ) : null}
          <View className="self-start bg-white/15 rounded-full px-3 py-1 mt-3">
            <Text className="text-white text-[11px] uppercase font-black">{profile?.status || "Active"}</Text>
          </View>
        </View>

        {/* Stats */}
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

        {/* Details / Edit form */}
        {profile ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[11px] text-gray-500 uppercase font-black">Account Details</Text>
              {editing && (
                <Text className="text-xs text-[#2A5C43] font-bold">Editing</Text>
              )}
            </View>

            <Row label="Unique ID" value={profile.unique_id || "Not set"} />
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role} />
            <Row
              label="Member Since"
              value={profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Not available"}
            />

            {editing ? (
              <>
                <EditField label="Name" value={editName} onChangeText={setEditName} icon="person-outline" />
                <EditField label="Phone" value={editPhone} onChangeText={setEditPhone} icon="phone" keyboardType="phone-pad" />
                <EditField label="Location" value={editLocation} onChangeText={setEditLocation} icon="location-on" />
                <EditField label="Payment Details (e.g. M-Pesa or Bank)" value={editPaymentDetails} onChangeText={setEditPaymentDetails} icon="account-balance-wallet" />

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
                <Row label="Payment Details" value={profile.payment_details || "Not set"} />
              </>
            )}
          </View>
        ) : null}

        {/* Verified Manager Card */}
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="verified-user" size={18} color="#2A5C43" />
            <Text className="text-[11px] text-gray-500 uppercase font-black">Your Cooperative Manager</Text>
          </View>
          {manager ? (
            <>
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-full bg-[#E7F5EE] items-center justify-center">
                  <MaterialIcons name="manage-accounts" size={24} color="#2A5C43" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-gray-900 font-black text-base">{manager.name}</Text>
                    <MaterialIcons name="verified" size={16} color="#2A5C43" />
                  </View>
                  <Text className="text-gray-500 text-sm">{manager.email}</Text>
                </View>
              </View>
              {manager.phone ? (
                <View className="flex-row items-center gap-2 mt-3 bg-[#F4FBF7] rounded-xl px-3 py-2">
                  <MaterialIcons name="phone" size={15} color="#2A5C43" />
                  <Text className="text-[#2A5C43] font-bold text-sm">{manager.phone}</Text>
                </View>
              ) : null}
              {manager.unique_id ? (
                <Text className="text-xs text-gray-400 mt-2">Manager ID: {manager.unique_id}</Text>
              ) : null}
            </>
          ) : (
            <View className="flex-row items-center gap-2 bg-amber-50 rounded-xl px-3 py-3">
              <MaterialIcons name="info-outline" size={18} color="#d97706" />
              <Text className="text-amber-700 text-sm font-medium flex-1">
                No verified manager assigned yet.
              </Text>
            </View>
          )}
        </View>

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

        <Pressable onPress={logout} className="rounded-xl bg-[#2A5C43] py-4 flex-row items-center justify-center gap-2 mb-2">
          <MaterialIcons name="logout" size={19} color="#ffffff" />
          <Text className="text-white font-black">Logout</Text>
        </Pressable>

        {/* Danger Zone */}
        {deleteMode ? (
          <View className="bg-red-50 rounded-xl p-4 border border-red-200 mb-8 mt-2">
            <Text className="text-xs text-red-800 font-bold mb-2">
              Type "{profile?.unique_id || profile?.email}" to confirm deletion:
            </Text>
            <TextInput
              className="bg-white border border-red-300 rounded-lg p-2 text-red-900 mb-3"
              value={deleteConfirmId}
              onChangeText={setDeleteConfirmId}
              placeholder="Enter ID"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row gap-2">
              <Pressable onPress={() => { setDeleteMode(false); setDeleteConfirmId("") }} className="flex-1 bg-gray-200 rounded-lg py-3 items-center">
                <Text className="text-gray-700 font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDelete} className="flex-1 bg-red-600 rounded-lg py-3 items-center">
                <Text className="text-white font-bold text-xs">Confirm Delete</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setDeleteMode(true)} className="mt-2 mb-8 self-center pb-4">
            <Text className="text-[11px] text-red-400 font-bold uppercase">Danger: Delete Account</Text>
          </Pressable>
        )}
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

function EditField({
  label,
  value,
  onChangeText,
  icon,
  keyboardType
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
