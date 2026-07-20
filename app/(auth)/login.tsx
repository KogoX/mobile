import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import api from "../../lib/api"
import { isBiometricSignInEnabled, saveSession, signInWithBiometrics, type Role } from "../../lib/session"
import WebContainer from "../../components/WebContainer"

const roles: Role[] = ["farmer", "manager", "buyer"]
const logo = require("../../assets/cemslogo.svg")

export default function LoginScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [role, setRole] = useState<Role>("farmer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [biometricReady, setBiometricReady] = useState(false)
  const [error, setError] = useState("")
  
  const isWide = width >= 760

  useEffect(() => {
    isBiometricSignInEnabled().then(setBiometricReady).catch(() => setBiometricReady(false))
  }, [])

  const signIn = async () => {
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password })
      await saveSession(data.token, data.user)

      // Always route to their database-assigned role rather than the selected tab
      router.replace(`/${data.user.role}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  const biometricSignIn = async () => {
    setLoading(true)
    setError("")

    try {
      const user = await signInWithBiometrics()
      router.replace(`/${user.role}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const insets = useSafeAreaInsets()

  return (
    <WebContainer bg="#78716c">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#78716c' }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : StatusBar.currentHeight ?? 0}
      >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View 
          className={`bg-[#EAEAEA] rounded-3xl p-6 pb-8 shadow-lg relative overflow-hidden w-full ${
            isWide ? 'max-w-[420px] p-8' : 'max-w-[340px]'
          }`}
        >
          {/* Decorative Bottom Right Circles */}
          <View className="absolute -bottom-12 -right-12 opacity-10 pointer-events-none">
            <View className="w-40 h-40 rounded-full border-[12px] border-[#2A5C43] items-center justify-center">
              <View className="w-20 h-20 rounded-full border-[12px] border-[#2A5C43]" />
            </View>
          </View>

          {/* Header & Logo */}
          <View className="items-center mt-4 mb-8">
            <View className="flex-row items-center mb-3">
              <Image 
                source={logo} 
                style={{ width: 24, height: 24 }} 
                contentFit="contain" 
                tintColor="#2A5C43" 
              />
              <Text className="text-2xl font-black text-[#2A5C43] ml-2 tracking-wide">
                CEMS
              </Text>
            </View>
            <Text className="text-center text-gray-500 font-medium px-4">
              Cooperative Export Management{'\n'}System
            </Text>
          </View>

          {/* Role Selector */}
          <View className="mb-6">
            <Text className="text-[10px] font-bold text-center text-gray-600 mb-3 tracking-widest uppercase">
              Select Role
            </Text>
            <View className="flex-row justify-center gap-3">
              {roles.map((item) => {
                const active = item === role
                return (
                  <Pressable
                    key={item}
                    onPress={() => setRole(item)}
                    className={`px-5 py-2.5 rounded-full shadow-sm ${
                      active ? 'bg-[#2A5C43]' : 'bg-[#F9F9F9]'
                    }`}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        active ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {item[0].toUpperCase() + item.slice(1)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <Text className="text-red-500 text-center mb-4 font-medium">{error}</Text>
          ) : null}

          {/* Inputs */}
          <Field
            label="Email Address"
            icon="mail-outline"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field 
            label="Password" 
            icon="lock-outline" 
            placeholder="Enter your password" 
            secureTextEntry={!showPassword}
            showToggle
            onToggleShow={() => setShowPassword((v) => !v)}
            isVisible={showPassword}
            value={password}
            onChangeText={setPassword}
          />

          {/* Options Row */}
          <View className="flex-row justify-between items-center mb-8 px-1 mt-1">
            <Pressable 
              className="flex-row items-center" 
              onPress={() => setRemember((value) => !value)}
            >
              <View className={`w-4 h-4 border rounded-[3px] mr-2 items-center justify-center ${
                remember ? 'bg-[#2A5C43] border-[#2A5C43]' : 'border-gray-400 bg-transparent'
              }`}>
                {remember ? <MaterialIcons name="check" size={12} color="#ffffff" /> : null}
              </View>
              <Text className="text-sm text-gray-600 font-medium">Remember me</Text>
            </Pressable>
            <Pressable>
              <Text className="text-sm text-[#2A5C43] underline font-medium">
                Forgot password?
              </Text>
            </Pressable>
          </View>

          {/* Submit Button & Biometrics */}
          <View className="flex-row gap-3 mb-8">
            <Pressable 
              className={`flex-1 bg-[#2A5C43] rounded-xl py-4 shadow-md active:opacity-80 flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`} 
              onPress={signIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
              <Text className="text-white text-center font-bold text-base">
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </Pressable>

            <Pressable
              className={`border rounded-xl px-4 justify-center items-center ${biometricReady ? 'bg-white border-[#2A5C43]' : 'bg-gray-50 border-gray-200'}`}
              onPress={() => {
                if (biometricReady) {
                  biometricSignIn()
                } else {
                  Alert.alert("Not Enabled", "Please sign in with your password first, then enable biometrics in your profile settings.")
                }
              }}
              disabled={loading}
            >
              <MaterialIcons name="fingerprint" size={28} color={biometricReady ? "#2A5C43" : "#9CA3AF"} />
            </Pressable>
          </View>

          {/* Footer */}
          <View className="flex-col items-center gap-1 mb-4">
            <Text className="text-gray-500 font-medium text-sm">
              Don&apos;t have an account?
            </Text>
            <Pressable onPress={() => router.push({ pathname: "/(auth)/onboarding", params: { role } })}>
              <Text className="text-[#2A5C43] underline font-black text-sm">
                Create your {role} profile
              </Text>
            </Pressable>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </WebContainer>
  )
}

function Field({
  label,
  icon,
  placeholder,
  secureTextEntry,
  keyboardType,
  value,
  onChangeText,
  showToggle,
  onToggleShow,
  isVisible,
}: {
  label: string
  icon: keyof typeof MaterialIcons.glyphMap
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: "default" | "email-address"
  value: string
  onChangeText: (text: string) => void
  showToggle?: boolean
  onToggleShow?: () => void
  isVisible?: boolean
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-gray-700 mb-1.5 ml-1">
        {label}
      </Text>
      <View className="flex-row items-center bg-[#F9F9F9] rounded-xl px-4 py-3.5 shadow-sm border border-gray-100">
        <MaterialIcons name={icon} size={20} color="#71717A" />
        <TextInput
          className="flex-1 ml-3 text-gray-800 font-medium"
          placeholder={placeholder}
          placeholderTextColor="#A1A1AA"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          style={{ outlineStyle: "none" } as never}
          value={value}
          onChangeText={onChangeText}
        />
        {showToggle ? (
          <Pressable onPress={onToggleShow} hitSlop={8}>
            <MaterialIcons
              name={isVisible ? "visibility" : "visibility-off"}
              size={20}
              color="#71717A"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
