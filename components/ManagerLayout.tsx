import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import type { ReactNode } from "react"
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native"

const logo = require("../assets/cemslogo.svg")
const managerPhoto = "https://lh3.googleusercontent.com/aida-public/AB6AXuDA6vlv2MI1vQB2hYix3P2Rnc5jUJm_pTah5NZetjnc4V2Q3FtnIEB6t5-lRf3iq3Qjrb8MwN1Oijm4H6v6FaeHAFRgmSpSXkfkGx1gvAe3sge3xOq36v2E8FtCfgNZ4AcOuzeJbE4_Rtr2dOwjlrqoN394v0JGlQynkSWvFVRlcPGvqCEYm8xf0YOMIRKhcn2kO5FQrvRVfXpy-k-f1qquZdR_wF7q6S5GTiW_gDglyWI7mESocOzQ_nwaM1TZPj08Jo_DF2JJ0TNg"

const nav = [
  ["dashboard", "Dashboard", "/manager"],
  ["groups", "Farmers", "/manager/farmers"],
  ["shopping-cart", "Orders", "/manager/orders"],
  ["payments", "Payments", "/manager/payouts"],
  ["analytics", "Reports", "/manager"],
  ["settings", "Settings", "/manager/settings"],
] as const

// --- SHARED LAYOUT COMPONENTS ---

export function ManagerLayout({ active, children }: { active: string; children: ReactNode }) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 900

  return (
    <View className="flex-1 bg-[#FCF9F8] flex-row">
      
      {/* Sidebar Navigation */}
      {isDesktop && (
        <View className="w-64 bg-[#114C3A] min-h-screen shadow-2xl z-20 flex-col">
          {/* Brand Header */}
          <View className="h-28 px-8 flex-row items-center gap-3">
            <Image source={logo} style={{ width: 24, height: 24 }} contentFit="contain" tintColor="#ffffff" />
            <Text className="text-white text-2xl font-black tracking-wide">CEMS</Text>
          </View>
          
          {/* Navigation Links */}
          <View className="flex-1">
            {nav.map(([icon, label, href]) => {
              const isActive = active === label
              return (
                <Pressable
                  key={label}
                  className={`min-h-[58px] px-8 flex-row items-center gap-4 border-r-4 ${
                    isActive ? 'bg-[#18634B] border-r-[#A3E635]' : 'border-r-transparent hover:bg-[#18634B]/50'
                  }`}
                  onPress={() => router.push(href as never)}
                >
                  <MaterialIcons name={icon} size={20} color={isActive ? "#A3E635" : "#86A79C"} />
                  <Text className={`text-[15px] ${isActive ? 'text-[#A3E635] font-black' : 'text-[#86A79C] font-bold'}`}>
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* User Profile Dock */}
          <View className="h-24 px-6 bg-[#0A3326] flex-row items-center gap-3">
            <Image source={{ uri: managerPhoto }} className="w-10 h-10 rounded-full bg-gray-300" contentFit="cover" />
            <View className="flex-1">
              <Text className="text-white text-[13px] font-black">Cooperative Manager</Text>
              <Text className="text-[#86A79C] text-[10px] font-bold mt-0.5">Kiambu Sector</Text>
            </View>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View className="flex-1">
        {children}
      </View>
    </View>
  )
}

export function ManagerFooter() {
  return (
    <View className="mt-16 pt-8 pb-12 border-t border-[#EAF5F0] flex-row justify-between items-center gap-4 flex-wrap">
      <View>
        <Text className="text-[#0F5238] text-lg font-black mb-1">CEMS</Text>
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
          © 2024 CEMS Kenya. Cultivating Export Excellence.
        </Text>
      </View>
      <View className="flex-row gap-6 flex-wrap">
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest underline">Privacy Policy</Text>
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest underline">Terms of Service</Text>
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest underline">Export Guidelines</Text>
      </View>
    </View>
  )
}