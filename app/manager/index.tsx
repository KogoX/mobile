import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  SafeAreaView,
  Platform,
} from "react-native"
import { useState, useEffect } from "react"

const logo = require("../../assets/cemslogo.svg")

const stats = [
  { icon: "agriculture", label: "Total Yield (kg)", value: "14,280" },
  { icon: "account-balance-wallet", label: "Pending Payments (KES)", value: "428,500" },
  { icon: "shopping-bag", label: "Completed Orders", value: "84" },
  { icon: "workspace-premium", label: "Cooperative Rank", value: "#04", hint: "Top Performer", isDark: true },
]

const bars = [
  { month: "Jan", height: 35, color: "bg-[#D1EBDD]" },
  { month: "Feb", height: 50, color: "bg-[#A3D9BE]" },
  { month: "Mar", height: 45, color: "bg-[#75C69F]" },
  { month: "Apr", height: 75, color: "bg-[#47B380]" },
  { month: "May", height: 95, color: "bg-[#106D4B]" },
  { month: "Jun", height: 85, color: "bg-[#0F5238]" },
]

export default function ManagerDashboardMobile() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/payments")
      .then(res => res.json())
      .then(data => setPayments(data))
      .catch(err => console.error(err));
  }, []);
  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      
      {/* Main Scrollable Content */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }} // Padding for bottom nav
        showsVerticalScrollIndicator={false}
      >
        <View className="p-5">
          
          {/* Top Brand */}
          <View className="flex-row items-center gap-2 mb-8">
            <Image source={logo} style={{ width: 20, height: 20 }} contentFit="contain" tintColor="#0F5238" />
            <Text className="text-[#0F5238] text-lg font-black tracking-wide">CEMS</Text>
          </View>

          {/* Welcome Header */}
          <View className="mb-6">
            <Text className="text-4xl font-black text-[#0F5238] font-serif leading-[42px] mb-2">
              Good morning,{'\n'}Peter 🌱
            </Text>
            <Text className="text-gray-600 text-sm leading-relaxed mb-4">
              Your orchard is thriving. Here's your export summary for today.
            </Text>
            <View className="self-start bg-[#A0F4C8] rounded-full px-4 py-2 flex-row items-center gap-2">
              <View className="bg-[#002113] rounded-full w-4 h-4 items-center justify-center">
                <MaterialIcons name="done" size={12} color="#A0F4C8" />
              </View>
              <Text className="text-[#002113] text-[11px] font-black uppercase tracking-widest">
                Tier 1 Verified Producer
              </Text>
            </View>
          </View>

          {/* Stats List (Vertical Stack for Mobile) */}
          <View className="gap-4 mb-8">
            {stats.map((stat, idx) => (
              <View 
                key={idx} 
                className={`rounded-2xl p-5 shadow-sm border ${
                  stat.isDark ? 'bg-[#0F5238] border-[#0F5238]' : 'bg-white border-gray-100'
                }`}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mb-1 ${
                    stat.isDark ? 'bg-[#18634B]' : 'bg-[#EAF5F0]'
                  }`}>
                    <MaterialIcons 
                      name={stat.icon as any} 
                      size={20} 
                      color={stat.isDark ? "#A3E635" : "#2A5C43"} 
                    />
                  </View>
                </View>
                <Text className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                  stat.isDark ? 'text-[#b1f0ce]' : 'text-gray-500'
                }`}>
                  {stat.label}
                </Text>
                <View className="flex-row items-end gap-2">
                  <Text className={`text-3xl font-black font-serif ${
                    stat.isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    {stat.value}
                  </Text>
                  {stat.hint && (
                    <Text className="text-[#A3E635] text-xs font-bold mb-1.5 ml-1">{stat.hint}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Log New Harvest Card */}
          <View className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-8">
            <Text className="text-[#0F5238] text-2xl font-black font-serif mb-5">Log New Harvest</Text>
            
            <FormField label="Crop Season" value="Main Season 2024" isDropdown />
            <FormField label="Quantity (Kilograms)" value="0.00" />
            
            <View className="mt-4 mb-2">
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Produce Grade</Text>
              <View className="flex-row gap-3">
                {["A", "B", "C"].map((grade) => (
                  <Pressable 
                    key={grade} 
                    className={`flex-1 border rounded-xl py-3.5 items-center ${
                      grade === "A" ? 'bg-[#0F5238] border-[#0F5238]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={`font-black text-sm ${grade === "A" ? 'text-white' : 'text-gray-600'}`}>{grade}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <FormField label="Harvest Date" value="mm/dd/yyyy" />
            
            <Pressable className="mt-6 bg-[#0F5238] rounded-full min-h-[54px] flex-row items-center justify-center gap-2 shadow-sm active:opacity-80">
              <MaterialIcons name="add-task" size={20} color="#ffffff" />
              <Text className="text-white font-black text-sm">Submit Yield Record</Text>
            </Pressable>
          </View>

          {/* Earnings Performance Card */}
          <View className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-8">
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1">
                <Text className="text-[#0F5238] text-2xl font-black font-serif leading-tight mb-1">Earnings{'\n'}Performance</Text>
                <Text className="text-gray-500 text-xs mt-1 leading-relaxed">Export revenue trends over the last 6 months.</Text>
              </View>
              <Pressable className="ml-4 p-2">
                <MaterialIcons name="file-download" size={24} color="#71717A" />
              </Pressable>
            </View>
            
            <View className="h-48 flex-row items-end gap-2 px-1 pb-6 mt-4 border-b border-gray-100">
              {bars.map((bar) => (
                <View key={bar.month} className="flex-1 h-full justify-end items-center">
                  <View className={`w-full rounded-t-md ${bar.color}`} style={{ height: `${bar.height}%` }} />
                  <Text className="text-gray-400 text-[9px] font-black uppercase mt-3">{bar.month}</Text>
                </View>
              ))}
            </View>
            
            <View className="pt-5 flex-row items-center justify-between px-2">
              <View>
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Average Yield</Text>
                <Text className="text-xl font-black text-gray-800">2,380kg</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Growth Rate</Text>
                <Text className="text-xl font-black text-[#0F5238]">+18.4%</Text>
              </View>
            </View>
          </View>

          {/* Recent Payments Card */}
          <View className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-8">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1 pr-4">
                <Text className="text-[#0F5238] text-2xl font-black font-serif leading-tight">Recent{'\n'}Payments</Text>
                <Text className="text-gray-500 text-[11px] mt-2 leading-relaxed">Track your most recent settlements from international buyers.</Text>
              </View>
              <Pressable className="bg-white border border-gray-200 rounded-full px-4 py-2.5 shadow-sm active:bg-gray-50">
                <Text className="text-gray-800 font-black text-[10px] uppercase tracking-widest text-center">View All{'\n'}Statements</Text>
              </Pressable>
            </View>

            {/* Mobile Table Header */}
            <View className="flex-row pb-3 border-b border-gray-100 mb-3">
              <Text className="flex-[1.2] text-gray-400 text-[9px] font-black uppercase tracking-widest">Order ID</Text>
              <Text className="flex-[1.5] text-gray-400 text-[9px] font-black uppercase tracking-widest">Buyer</Text>
              <Text className="flex-[0.8] text-gray-400 text-[9px] font-black uppercase tracking-widest">Quantity</Text>
              <Text className="flex-1 text-gray-400 text-[9px] font-black uppercase tracking-widest text-right">Amount / Status</Text>
            </View>

            {/* Mobile Table Rows */}
            <View className="gap-4">
              {payments.map((payment, i) => (
                <View key={i} className={`flex-row items-center py-2 ${i !== payments.length - 1 ? 'border-b border-gray-50 pb-4' : ''}`}>
                  <View className="flex-[1.2]">
                    <Text className="text-gray-800 font-black text-[11px]">{(payment.order || payment.id)?.split('-')[0]}-</Text>
                    <Text className="text-gray-800 font-black text-[11px]">{(payment.order || payment.id)?.split('-').slice(1).join('-')}</Text>
                  </View>
                  <Text className="flex-[1.5] text-gray-600 font-bold text-[11px] pr-2">{payment.buyer}</Text>
                  <Text className="flex-[0.8] text-gray-500 font-medium text-[11px]">{payment.qty || payment.quantity}</Text>
                  <View className="flex-1 items-end">
                    <Text className="text-gray-800 font-black text-[11px] mb-1">{payment.amount}</Text>
                    <View className={`px-2 py-0.5 rounded text-center ${payment.status === 'Verified' ? 'bg-[#D1F4E0]' : 'bg-[#FEF3C7]'}`}>
                      <Text className={`text-[8px] font-black uppercase tracking-widest ${payment.status === 'Verified' ? 'text-[#0F5238]' : 'text-[#92400E]'}`}>
                        {payment.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Footer Text */}
          <View className="items-center mt-4 mb-8">
            <View className="flex-row items-center gap-1.5 mb-3">
              <MaterialIcons name="eco" size={14} color="#A1A1AA" />
              <Text className="text-gray-400 text-sm font-black tracking-widest">CEMS KENYA</Text>
            </View>
            <View className="flex-row gap-4 mb-3">
              <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest underline">Privacy Policy</Text>
              <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest underline">Terms Of Service</Text>
              <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest underline">Export Guidelines</Text>
            </View>
            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest text-center">
              © 2024 CEMS KENYA. CULTIVATING EXPORT{'\n'}EXCELLENCE.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex-row justify-around items-end pb-6 pt-3 px-2 shadow-lg"
        style={{ paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}
      >
        <NavIcon icon="home" label="Home" isActive />
        <NavIcon icon="receipt-long" label="History" />
        
        {/* Floating Action Button (Center) */}
        <View className="relative -top-6 items-center">
          <Pressable className="w-14 h-14 bg-[#0F5238] rounded-full items-center justify-center shadow-md active:opacity-80 border-4 border-[#FCF9F8]">
            <MaterialIcons name="add" size={28} color="#ffffff" />
          </Pressable>
        </View>

        <NavIcon icon="bar-chart" label="Stats" />
        <NavIcon icon="person-outline" label="Profile" />
      </View>
    </SafeAreaView>
  )
}

// Subcomponent for form fields
function FormField({ label, value, isDropdown }: { label: string; value: string; isDropdown?: boolean }) {
  return (
    <View className="mt-4">
      <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      {isDropdown ? (
        <Pressable className="min-h-[50px] bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between active:bg-gray-50">
          <Text className="text-gray-800 font-bold text-sm">{value}</Text>
          <MaterialIcons name="expand-more" size={20} color="#71717A" />
        </Pressable>
      ) : (
        <TextInput 
          className="min-h-[50px] bg-white border border-gray-200 rounded-xl px-4 text-gray-800 font-bold text-sm" 
          placeholder={value} 
          placeholderTextColor="#A1A1AA" 
          style={{ outlineStyle: 'none' } as never}
        />
      )}
    </View>
  )
}

// Subcomponent for Bottom Nav Icons
function NavIcon({ icon, label, isActive }: { icon: any; label: string; isActive?: boolean }) {
  return (
    <Pressable className="items-center justify-center gap-1 px-4 active:opacity-50">
      <MaterialIcons name={icon} size={24} color={isActive ? "#0F5238" : "#A1A1AA"} />
      <Text className={`text-[9px] font-black ${isActive ? 'text-[#0F5238]' : 'text-[#A1A1AA]'}`}>
        {label}
      </Text>
    </Pressable>
  )
}