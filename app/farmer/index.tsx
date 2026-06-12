import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native"

const logo = require("../../assets/cemslogo.svg")

const stats = [
  ["agriculture", "Total Yield (kg)", "14,280", "+12% vs last mo"],
  ["account-balance-wallet", "Pending Payments (KES)", "428,500", ""],
  ["shopping-bag", "Completed Orders", "84", ""],
  ["workspace-premium", "Cooperative Rank", "#04", "Top Performer"],
] as const

const bars = [
  ["Jan", 40],
  ["Feb", 55],
  ["Mar", 45],
  ["Apr", 70],
  ["May", 90],
  ["Jun", 80],
] as const

const payments = [
  ["ORD-2024-892", "Global Green Exporters", "1,200 kg", "KES 36,000.00", "Verified"],
  ["ORD-2024-885", "EuroHarvest GmbH", "850 kg", "KES 25,500.00", "Pending"],
  ["ORD-2024-870", "AvoDirect UK Ltd.", "2,400 kg", "KES 72,000.00", "Verified"],
] as const

export default function FarmerDashboard() {
  const { width } = useWindowDimensions()
  const isWide = width >= 900

  return (
    <ScrollView className="flex-1 bg-[#FCF9F8]" contentContainerStyle={{ paddingBottom: 42 }}>
      
      {/* Top Bar */}
      <View className="min-h-[72px] px-6 border-b border-[#EAEAEA] bg-white flex-row items-center justify-between gap-4 shadow-sm z-10">
        <View className="flex-row items-center gap-2">
          <Image source={logo} style={{ width: 24, height: 24 }} contentFit="contain" tintColor="#2A5C43" />
          <Text className="text-[#2A5C43] text-xl font-black tracking-wide">CEMS</Text>
        </View>
        <View className="flex-row gap-6 items-center">
          <Text className="text-[#2A5C43] font-black text-sm underline underline-offset-4">Dashboard</Text>
          {isWide && (
            <>
              <Text className="text-gray-500 font-bold text-sm">Markets</Text>
              <Text className="text-gray-500 font-bold text-sm">Resources</Text>
            </>
          )}
        </View>
      </View>

      <View className="w-full max-w-[1160px] self-center p-5 gap-6 mt-2">
        
        {/* Welcome Section */}
        <View className={`gap-4 ${isWide ? 'flex-row justify-between items-end' : 'flex-col'}`}>
          <View>
            <Text className={`text-[#2A5C43] font-black ${isWide ? 'text-5xl leading-[56px]' : 'text-4xl leading-[42px]'}`}>
              Good morning, Peter
            </Text>
            <Text className="text-gray-600 text-base md:text-lg mt-2 leading-relaxed">
              Your orchard is thriving. Here's your export summary for today.
            </Text>
          </View>
          <View className="self-start bg-[#A0F4C8] rounded-full px-4 py-2.5 flex-row items-center gap-2">
            <MaterialIcons name="verified" size={18} color="#002113" />
            <Text className="text-[#002113] text-xs font-black uppercase tracking-widest">
              Tier 1 Verified Producer
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className={`gap-5 mt-2 ${isWide ? 'flex-row' : 'flex-col'}`}>
          {stats.map(([icon, label, value, note], index) => {
            const isRank = index === 3
            return (
              <View 
                key={label} 
                className={`flex-1 min-h-[160px] border border-gray-100 rounded-3xl p-6 justify-between shadow-sm ${
                  isRank ? 'bg-[#2A5C43] border-[#2A5C43]' : 'bg-white'
                }`}
              >
                <View className="flex-row justify-between items-start">
                  <View className={`w-11 h-11 rounded-xl items-center justify-center ${isRank ? 'bg-[#1b4332]' : 'bg-[#EAF0EC]'}`}>
                    <MaterialIcons
                      name={icon as keyof typeof MaterialIcons.glyphMap}
                      size={22}
                      color={isRank ? "#A3E635" : "#2A5C43"}
                    />
                  </View>
                  {note && !isRank && <Text className="text-[#2A5C43] text-xs font-black">{note}</Text>}
                </View>
                <View className="mt-4">
                  <Text className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isRank ? 'text-[#b1f0ce]' : 'text-gray-500'}`}>
                    {label}
                  </Text>
                  <Text className={`text-3xl font-black ${isRank ? 'text-white' : 'text-gray-800'}`}>
                    {value} {isRank && <Text className="text-[#b1f0ce] text-sm font-bold ml-1">{note}</Text>}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* Main Content Grid */}
        <View className={`gap-5 ${isWide ? 'flex-row' : 'flex-col'}`}>
          
          {/* Harvest Form Card */}
          <View className="flex-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <Text className="text-[#2A5C43] text-2xl font-black mb-4">Log New Harvest</Text>
            
            <FormField label="Crop Season" value="Main Season 2024" />
            <FormField label="Quantity (Kilograms)" value="0.00" input />
            
            <View className="mt-4 mb-2">
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Produce Grade</Text>
              <View className="flex-row gap-3">
                {["A", "B", "C"].map((grade) => (
                  <Pressable 
                    key={grade} 
                    className={`flex-1 border rounded-xl py-3 items-center ${
                      grade === "A" ? 'bg-[#2A5C43] border-[#2A5C43]' : 'bg-[#F9F9F9] border-gray-200'
                    }`}
                  >
                    <Text className={`font-black ${grade === "A" ? 'text-white' : 'text-gray-500'}`}>{grade}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <FormField label="Harvest Date" value="Select date" />
            
            <Pressable className="mt-6 bg-[#2A5C43] rounded-full min-h-[54px] flex-row items-center justify-center gap-2 active:opacity-80">
              <MaterialIcons name="add-task" size={20} color="#ffffff" />
              <Text className="text-white font-black text-sm">Submit Yield Record</Text>
            </Pressable>
          </View>

          {/* Chart Card */}
          <View className="flex-[2] bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-[#2A5C43] text-2xl font-black">Earnings Performance</Text>
                <Text className="text-gray-500 font-medium text-sm mt-1">Export revenue trends over the last 6 months</Text>
              </View>
              <Pressable className="bg-[#F9F9F9] p-2.5 rounded-full border border-gray-100">
                <MaterialIcons name="download" size={20} color="#71717A" />
              </Pressable>
            </View>
            
            <View className="h-64 flex-row items-end gap-3 px-2 pb-6">
              {bars.map(([month, height]) => (
                <View key={month} className="flex-1 h-full justify-end items-center">
                  <View className="w-full bg-[#2A5C43] rounded-t-lg" style={{ height: `${height}%` }} />
                  <Text className="text-gray-500 text-[10px] font-black uppercase mt-3">{month}</Text>
                </View>
              ))}
            </View>
            
            <View className="border-t border-gray-100 pt-5 flex-row items-center justify-around">
              <Metric label="Average Yield" value="2,380kg" />
              <View className="w-px h-10 bg-gray-200" />
              <Metric label="Growth Rate" value="+18.4%" primary />
            </View>
          </View>
        </View>

        {/* Payments Card */}
        <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <View className={`bg-[#FAFAFA] p-6 border-b border-gray-100 ${isWide ? 'flex-row justify-between items-center' : 'gap-4'}`}>
            <View>
              <Text className="text-[#2A5C43] text-2xl font-black">Recent Payments</Text>
              <Text className="text-gray-500 font-medium text-sm mt-1">Track recent settlements from international buyers</Text>
            </View>
            <Pressable className="self-start bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm active:bg-gray-50">
              <Text className="text-gray-800 font-black text-xs">View All Statements</Text>
            </Pressable>
          </View>
          
          <View className="p-2">
            {payments.map(([id, buyer, quantity, amount, status], i) => (
              <View 
                key={id} 
                className={`p-4 gap-2 ${isWide ? 'flex-row items-center' : 'flex-col'} ${i !== payments.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <Text className="flex-1 text-gray-800 font-black text-sm">{id}</Text>
                <Text className="flex-[1.2] text-gray-600 font-semibold text-sm">{buyer}</Text>
                <Text className="flex-1 text-gray-500 font-medium text-sm">{quantity}</Text>
                <Text className="flex-1 text-gray-800 font-black text-sm">{amount}</Text>
                <View className="flex-1 items-start">
                  <Text className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                    status === "Verified" ? 'bg-[#A0F4C8] text-[#005236]' : 'bg-[#E6E3D0] text-[#48473A]'
                  }`}>
                    {status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  )
}

function FormField({ label, value, input }: { label: string; value: string; input?: boolean }) {
  return (
    <View className="mt-4">
      <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      {input ? (
        <TextInput 
          className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 text-gray-800 font-bold" 
          placeholder={value} 
          placeholderTextColor="#A1A1AA" 
          keyboardType="numeric" 
          style={{ outlineStyle: 'none' } as never}
        />
      ) : (
        <Pressable className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 flex-row items-center justify-between active:bg-gray-100">
          <Text className="text-gray-800 font-bold text-sm">{value}</Text>
          <MaterialIcons name="expand-more" size={20} color="#71717A" />
        </Pressable>
      )}
    </View>
  )
}

function Metric({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <View className="items-center flex-1">
      <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</Text>
      <Text className={`text-2xl font-black ${primary ? 'text-[#2A5C43]' : 'text-gray-800'}`}>{value}</Text>
    </View>
  )
}