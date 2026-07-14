import { MaterialIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { saveSession, type Role } from "../../lib/session"

const roles: Role[] = ["farmer", "manager", "buyer"]

const COUNTRY_CODES = [
  { code: "+254", label: "Kenya" },
  { code: "+255", label: "Tanzania" },
  { code: "+256", label: "Uganda" },
  { code: "+250", label: "Rwanda" },
  { code: "+257", label: "Burundi" },
  { code: "+44", label: "United Kingdom" },
  { code: "+1", label: "USA / Canada" }
]

export default function OnboardingScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ role?: string }>()
  const initialRole = roles.includes(params.role as Role) ? (params.role as Role) : "farmer"

  const [role, setRole] = useState<Role>(initialRole)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [dialCode, setDialCode] = useState("+254")
  const [phone, setPhone] = useState("")
  const [showCodes, setShowCodes] = useState(false)
  const [location, setLocation] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert("Missing details", "Name, email and password are required.")
      return
    }

    const normalizedPhone = phone.replace(/[^0-9]/g, "")
    if (phone && normalizedPhone.length < 6) {
      Alert.alert("Invalid phone", "Please enter a valid mobile number.")
      return
    }
    const fullPhone = phone ? `${dialCode}${normalizedPhone}` : ""

    try {
      setLoading(true)
      const { data } = await api.post("/auth/register", {
        name,
        email,
        phone: fullPhone,
        location,
        password,
        role
      })
      await saveSession(data.token, data.user)
      router.replace(`/${data.user.role}`)
    } catch (error: any) {
      Alert.alert("Registration failed", error?.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f4f4f4]">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="bg-white rounded-2xl p-6 border border-gray-200">
            <Text className="text-3xl font-black text-[#2A5C43] mb-2">Create account</Text>

            <Text className="text-[11px] font-bold text-gray-500 uppercase mb-2">Role</Text>
            <View className="flex-row gap-2 mb-4">
              {roles.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setRole(item)}
                  className={`px-4 py-2 rounded-full ${item === role ? "bg-[#2A5C43]" : "bg-gray-100"}`}
                >
                  <Text className={item === role ? "text-white font-bold" : "text-gray-700 font-bold"}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Field label="Full Name" value={name} onChangeText={setName} icon="person-outline" />
            <Field label="Email" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" />
            <View className="mb-3">
              <Text className="text-[11px] font-bold text-gray-500 uppercase mb-1">Phone</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3">
                <MaterialIcons name="phone" size={18} color="#6b7280" />
                <Pressable
                  onPress={() => setShowCodes((value) => !value)}
                  className="flex-row items-center pl-2 pr-2 border-r border-gray-200"
                >
                  <Text className="text-gray-800 font-bold min-w-[44px] text-center">{dialCode}</Text>
                  <MaterialIcons name="arrow-drop-down" size={18} color="#6b7280" />
                </Pressable>
                <TextInput
                  className="flex-1 min-h-[44px] ml-2 text-gray-800"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="712 345 678"
                  placeholderTextColor="#A1A1AA"
                  autoCapitalize="none"
                  style={{ outlineStyle: "none" } as never}
                />
              </View>
              {showCodes ? (
                <View className="mt-1 bg-white border border-gray-200 rounded-xl max-h-[180px] overflow-hidden">
                  <ScrollView className="max-h-[180px]">
                    {COUNTRY_CODES.map((item) => (
                      <Pressable
                        key={item.code}
                        onPress={() => {
                          setDialCode(item.code)
                          setShowCodes(false)
                        }}
                        className={`flex-row items-center justify-between px-4 py-3 border-b border-gray-100 ${
                          item.code === dialCode ? "bg-[#F4FBF7]" : ""
                        }`}
                      >
                        <Text className="text-gray-800 font-medium">{item.label}</Text>
                        <Text className="text-[#2A5C43] font-black">{item.code}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
            <Field
              label={role === "buyer" ? "Company / Location" : "Location"}
              value={location}
              onChangeText={setLocation}
              icon="location-on"
            />
            <Field label="Password" value={password} onChangeText={setPassword} icon="lock-outline" secureTextEntry />

            <Pressable
              className={`mt-4 rounded-xl py-4 items-center flex-row justify-center gap-2 ${loading ? "bg-[#53866f]" : "bg-[#2A5C43]"}`}
              onPress={handleRegister}
              disabled={loading}
            >
              <MaterialIcons name="check-circle-outline" color="#fff" size={18} />
              <Text className="text-white font-bold">{loading ? "Creating..." : "Create Account"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Field({
  label,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  keyboardType
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  icon: keyof typeof MaterialIcons.glyphMap
  secureTextEntry?: boolean
  keyboardType?: "default" | "email-address" | "phone-pad"
}) {
  return (
    <View className="mb-3">
      <Text className="text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</Text>
      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3">
        <MaterialIcons name={icon} size={18} color="#6b7280" />
        <TextInput
          className="flex-1 min-h-[44px] ml-2 text-gray-800"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          style={{ outlineStyle: "none" } as never}
        />
      </View>
    </View>
  )
}
