import { MaterialIcons } from "@expo/vector-icons"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { ManagerLayout, ManagerFooter } from "../../components/ManagerLayout"

// --- DASHBOARD DATA ---
const summaryStats = [
  { title: "Total Farmers", value: "1,284", hint: "↗ +12% from last month", hintColor: "text-gray-500" },
  { title: "Yield Aggregated", value: "42.8", unit: "MT", hint: "✓ Grade A Quality", hintColor: "text-[#0F5238]" },
  { title: "Active Orders", value: "156", hint: "⏱ 98 scheduled for pickup", hintColor: "text-gray-500" },
  { title: "Pending Approvals", value: "18", hint: "! Requires attention today", hintColor: "text-[#0F5238]", highlight: true },
]

const activityList = [
  { initials: "SM", name: "Samuel Mwangi", id: "KE-KM-8821", yield: "1,420", status: "DISBURSED", avatarBg: "bg-[#2A5C43]", avatarText: "text-white" },
  { initials: "JN", name: "Jane Njeri", id: "KE-KM-5510", yield: "890", status: "PENDING", avatarBg: "bg-[#EAE4D3]", avatarText: "text-[#2A5C43]" },
  { initials: "EO", name: "Emmanuel Otieno", id: "KE-KM-1204", yield: "2,110", status: "DISBURSED", avatarBg: "bg-[#2A5C43]", avatarText: "text-white" },
  { initials: "MW", name: "Mary Wanjiku", id: "KE-KM-3392", yield: "540", status: "FLAGGED", avatarBg: "bg-[#2A5C43]", avatarText: "text-white" },
]

const approvalQueue = [
  { orderId: "#EXP-7721", level: "LEVEL 2", title: "Premium Hass Batch", weight: "850 KG", origin: "Limuru" },
  { orderId: "#EXP-7724", level: "LEVEL 1", title: "Standard Fuerte Batch", weight: "1,200 KG", origin: "Gatundu" },
]

export default function ManagerDashboard() {
  return (
    <ManagerLayout active="Dashboard">
      
      {/* Top Header */}
      <View className="flex-row justify-between items-end p-8 pb-4 border-b border-[#EAF5F0] bg-white z-10">
        <View>
          <Text className="text-4xl font-black text-[#0F5238] font-serif mb-1">Operational Overview</Text>
          <Text className="text-[11px] font-black text-gray-600 uppercase tracking-widest">
            Harvest Season 2024 • Phase 2
          </Text>
        </View>
        <View className="flex-row items-center gap-6">
          <Pressable className="relative">
            <MaterialIcons name="notifications-none" size={28} color="#0F5238" />
            <View className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#DC2626] rounded-full border border-white" />
          </Pressable>
          <Pressable className="bg-[#0F5238] rounded-full px-6 py-3 shadow-sm active:opacity-80">
            <Text className="text-white font-bold text-sm">Generate Export Log</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 p-8">
        
        {/* Summary Cards */}
        <View className="flex-row gap-6 mb-10 flex-wrap">
          {summaryStats.map((stat, idx) => (
            <View 
              key={idx} 
              className={`flex-1 min-w-[200px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${
                stat.highlight ? 'border-l-4 border-l-[#0F5238]' : ''
              }`}
            >
              <Text className="text-[11px] font-black text-gray-700 uppercase tracking-widest mb-3">
                {stat.title}
              </Text>
              <Text className="text-4xl font-black text-[#0F5238] font-serif mb-3">
                {stat.value} {stat.unit && <Text className="text-lg font-bold text-gray-500 font-sans">{stat.unit}</Text>}
              </Text>
              <Text className={`text-xs font-bold ${stat.hintColor}`}>
                {stat.hint}
              </Text>
            </View>
          ))}
        </View>

        {/* Main Grid: Activity List (Left) & Approvals (Right) */}
        <View className="flex-row gap-8 flex-wrap">
          
          {/* Left Column: Farmer Activity List */}
          <View className="flex-[2] min-w-[500px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <View className="flex-row justify-between items-center p-6 border-b border-gray-50">
              <Text className="text-2xl font-black text-[#0F5238] font-serif">Farmer Activity List</Text>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center bg-[#F9F9F9] border border-gray-200 rounded-full px-4 py-2 w-64">
                  <MaterialIcons name="search" size={18} color="#A1A1AA" />
                  <TextInput 
                    placeholder="Search farmers..."
                    placeholderTextColor="#A1A1AA"
                    className="flex-1 ml-2 text-sm text-gray-800 font-medium"
                    style={{ outlineStyle: 'none' } as never}
                  />
                </View>
                <Pressable>
                  <MaterialIcons name="filter-list" size={24} color="#1b1b1b" />
                </Pressable>
              </View>
            </View>

            {/* Table Header */}
            <View className="flex-row bg-[#FAFAF9]/50 border-b border-gray-100 py-4 px-6">
              <Text className="flex-[1.5] text-gray-500 text-[10px] font-black uppercase tracking-widest">Farmer Name</Text>
              <Text className="flex-1 text-gray-500 text-[10px] font-black uppercase tracking-widest">Farmer ID</Text>
              <Text className="flex-1 text-gray-500 text-[10px] font-black uppercase tracking-widest">Yield (KG)</Text>
              <Text className="flex-1 text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Payment Status</Text>
              <Text className="w-20 text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Actions</Text>
            </View>

            {/* Table Rows */}
            {activityList.map((row, idx) => (
              <View key={idx} className="flex-row items-center py-5 px-6 border-b border-gray-50">
                <View className="flex-[1.5] flex-row items-center gap-3">
                  <View className={`w-9 h-9 rounded-full items-center justify-center ${row.avatarBg}`}>
                    <Text className={`text-xs font-black ${row.avatarText}`}>{row.initials}</Text>
                  </View>
                  <Text className="text-[#0F5238] font-medium text-[15px]">{row.name}</Text>
                </View>
                
                <Text className="flex-1 text-gray-600 text-[13px] font-medium">{row.id}</Text>
                <Text className="flex-1 text-gray-800 text-[15px] font-black">{row.yield}</Text>
                
                <View className="flex-1 items-center">
                  <View className={`px-3 py-1.5 rounded-full ${
                    row.status === 'DISBURSED' ? 'bg-[#D1F4E0]' : 
                    row.status === 'PENDING' ? 'bg-[#EAE4D3]' : 
                    'bg-[#FFDAD6]'
                  }`}>
                    <Text className={`text-[10px] font-black tracking-widest uppercase ${
                      row.status === 'DISBURSED' ? 'text-[#0F5238]' : 
                      row.status === 'PENDING' ? 'text-[#5C4A3D]' : 
                      'text-[#BA1A1A]'
                    }`}>
                      {row.status}
                    </Text>
                  </View>
                </View>

                <Pressable className="w-20 items-center active:opacity-60">
                  <Text className="text-[#0F5238] font-black text-xs text-center">View{'\n'}Details</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Right Column: Approval Queue & Optimization Tip */}
          <View className="flex-1 min-w-[300px] gap-6">
            <Text className="text-2xl font-black text-[#0F5238] font-serif mb-[-8px]">Approval Queue</Text>
            
            {/* Queue Cards */}
            {approvalQueue.map((item, idx) => (
              <View key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order {item.orderId}</Text>
                  <View className="bg-[#F4F4F4] px-2 py-1 rounded text-center">
                    <Text className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{item.level}</Text>
                  </View>
                </View>
                
                <Text className="text-lg font-black text-[#0F5238] font-serif mb-5">{item.title}</Text>
                
                <View className="flex-row gap-8 mb-6 pb-6 border-b border-gray-100">
                  <View>
                    <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Weight</Text>
                    <Text className="text-sm font-black text-gray-800">{item.weight}</Text>
                  </View>
                  <View>
                    <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Origin</Text>
                    <Text className="text-sm font-black text-gray-800">{item.origin}</Text>
                  </View>
                </View>

                <View className="flex-row gap-4">
                  <Pressable className="flex-1 bg-[#0F5238] rounded-full py-3 items-center shadow-sm active:opacity-80">
                    <Text className="text-white font-bold text-sm">Approve</Text>
                  </Pressable>
                  <Pressable className="flex-1 bg-white border border-[#DC2626] rounded-full py-3 items-center active:bg-red-50">
                    <Text className="text-[#DC2626] font-bold text-sm">Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Optimization Tip Card */}
            <View className="bg-[#EAF5F0] rounded-2xl p-6 border border-[#D1EBDD] flex-row gap-4 items-start mt-2">
              <View className="w-10 h-10 rounded-full bg-[#0F5238] items-center justify-center flex-shrink-0">
                <MaterialIcons name="lightbulb-outline" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-[#0F5238] font-black text-[15px] mb-1">Optimization Tip</Text>
                <Text className="text-[#0F5238] font-medium text-xs leading-relaxed">
                  Aggregating orders from Limuru could reduce logistics costs by 14%.
                </Text>
              </View>
            </View>

          </View>
        </View>

        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}