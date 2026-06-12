import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  KeyboardAvoidingView,
  Platform
} from "react-native"

type Role = "farmer" | "manager" | "buyer"

const roles: Role[] = ["farmer", "manager", "buyer"]
const logo = require("../../assets/cemslogo.svg")

export default function LoginScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [role, setRole] = useState<Role>("farmer")
  const [remember, setRemember] = useState(false)
  
  // Adjusted for Tailwind layout responsiveness
  const isWide = width >= 760

  const signIn = () => router.replace(`/${role}`)

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-stone-500"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View 
          className={`bg-[#EAEAEA] rounded-3xl p-6 pb-12 shadow-lg relative overflow-hidden w-full ${
            isWide ? 'max-w-2xl p-12' : 'max-w-md'
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
            <View className="flex-row justify-between">
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

          {/* Inputs */}
          <Field
            label="Email Address"
            icon="mail-outline"
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <Field 
            label="Password" 
            icon="lock-outline" 
            placeholder="Enter your password" 
            secureTextEntry 
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

          {/* Submit Button */}
          <Pressable 
            className="bg-[#2A5C43] rounded-xl py-4 shadow-md mb-8 active:opacity-80" 
            onPress={signIn}
          >
            <Text className="text-white text-center font-bold text-base">
              Sign In
            </Text>
          </Pressable>

          {/* Footer */}
          <View className="flex-col items-center gap-1 mb-4">
            <Text className="text-gray-500 font-medium text-sm">
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.push({ pathname: "/(auth)/onboarding", params: { role } })}>
              <Text className="text-gray-500 underline font-medium text-sm">
                Create your {role} profile
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({
  label,
  icon,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string
  icon: keyof typeof MaterialIcons.glyphMap
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: "default" | "email-address"
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
        />
      </View>
    </View>
  )
}