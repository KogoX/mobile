import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, Text, useWindowDimensions, View, Pressable, TextInput } from "react-native"

import { ManagerButton, ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const harvests = [
  { id: "#HV-8924", date: "Oct 24, 2024", season: "2024 Short Rains", variety: "Avocado (Hass)", qty: "1,250", grade: "Export" },
  { id: "#HV-8910", date: "Oct 15, 2024", season: "2024 Short Rains", variety: "Avocado (Fuerte)", qty: "840", grade: "Local" },
  { id: "#HV-8850", date: "Sep 02, 2024", season: "2024 Short Rains", variety: "Macadamia", qty: "320", grade: "Export" },
  { id: "#HV-8702", date: "Jun 18, 2024", season: "2024 Long Rains", variety: "Avocado (Hass)", qty: "2,100", grade: "Export" },
  { id: "#HV-8695", date: "May 30, 2024", season: "2024 Long Rains", variety: "Avocado (Fuerte)", qty: "650", grade: "Processing" },
]

export default function ManagerOrders() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 980

  return (
    <ManagerLayout
      active="Orders"
      title="Harvest History/ Orders"
      subtitle="Review past harvests, yields, and grading for your registered crops."
      action={
        <View className="flex-row gap-4 flex-wrap">
          <ManagerButton icon="file-download" label="Export" variant="outline" />
          <ManagerButton icon="add" label="New Record" />
        </View>
      }
    >
      <ScrollView className="flex-1 bg-[#FCF9F8]">
        <View className="p-8 pb-16 w-full max-w-[1100px] self-center">
          
          {/* Header */}
          <View className={`flex-row justify-between items-end mb-10 ${!isDesktop && 'flex-col items-start gap-4'}`}>
            <View>
              <Text className="text-4xl md:text-5xl font-black text-[#1b1b1b] font-serif mb-2">
                Harvest History<Text className="text-[#0F5238]">/ Orders</Text>
              </Text>
              <Text className="text-gray-600 text-[15px]">Review past harvests, yields, and grading for your registered crops.</Text>
            </View>
          </View>

          {/* Filters Bar */}
          <View className={`bg-white rounded-2xl p-4 mb-10 shadow-sm border border-gray-100 flex-wrap gap-4 ${isDesktop ? 'flex-row items-center' : 'flex-col'}`}>
            <View className="flex-1 min-w-[280px] border border-gray-200 rounded-xl px-4 flex-row items-center gap-3 h-[52px]">
              <MaterialIcons name="search" size={20} color="#A1A1AA" />
              <TextInput 
                className="flex-1 text-gray-800 text-[15px] font-medium"
                placeholder="Search by Harvest ID or Crop..."
                placeholderTextColor="#A1A1AA"
                style={{ outlineStyle: 'none' } as never}
              />
            </View>
            <Pressable className="min-w-[160px] border border-gray-200 rounded-xl px-4 flex-row items-center justify-between h-[52px] active:bg-gray-50">
              <Text className="text-gray-800 text-[15px] font-medium">Season</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#71717A" />
            </Pressable>
            <Pressable className="min-w-[160px] border border-gray-200 rounded-xl px-4 flex-row items-center justify-between h-[52px] active:bg-gray-50">
              <Text className="text-gray-800 text-[15px] font-medium">Grade</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#71717A" />
            </Pressable>
            <Pressable className="w-[52px] h-[52px] border border-gray-200 rounded-xl items-center justify-center active:bg-gray-50">
              <MaterialIcons name="filter-alt-off" size={20} color="#4A4A4A" />
            </Pressable>
          </View>

          {/* Table Container */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="min-w-[950px] w-full">
                
                {/* Table Header */}
                <View className="flex-row bg-[#FAFAF9]/50 border-b border-gray-100 py-5 px-6">
                  <Text className="w-[140px] text-gray-500 text-[10px] font-black uppercase tracking-widest">Date</Text>
                  <Text className="w-[130px] text-gray-500 text-[10px] font-black uppercase tracking-widest">Harvest ID</Text>
                  <Text className="w-[180px] text-gray-500 text-[10px] font-black uppercase tracking-widest">Crop Season</Text>
                  <Text className="w-[180px] text-gray-500 text-[10px] font-black uppercase tracking-widest">Variety</Text>
                  <Text className="w-[100px] text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Qty (kg)</Text>
                  <Text className="w-[120px] text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Grade</Text>
                  <Text className="w-[70px] text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Action</Text>
                </View>

                {/* Table Rows */}
                {harvests.map((row, idx) => (
                  <View key={row.id} className="flex-row items-center py-5 px-6 border-b border-gray-50 hover:bg-gray-50">
                    <Text className="w-[140px] text-gray-800 text-sm font-medium">{row.date}</Text>
                    <Text className="w-[130px] text-[#2D6A4F] text-sm font-bold tracking-wide">{row.id}</Text>
                    <Text className="w-[180px] text-gray-600 text-sm font-medium">{row.season}</Text>
                    <Text className="w-[180px] text-gray-800 text-sm font-medium">{row.variety}</Text>
                    <Text className="w-[100px] text-gray-800 text-sm font-black text-center">{row.qty}</Text>
                    
                    <View className="w-[120px] items-center">
                      <View className={`px-3 py-1.5 rounded-full ${
                        row.grade === 'Export' ? 'bg-[#D1F4E0]' : 
                        row.grade === 'Local' ? 'bg-[#EAE3D5]' : 
                        'bg-[#EAEAEA]'
                      }`}>
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${
                          row.grade === 'Export' ? 'text-[#0F5238]' : 
                          row.grade === 'Local' ? 'text-[#5C4A3D]' : 
                          'text-[#4A4A4A]'
                        }`}>
                          {row.grade}
                        </Text>
                      </View>
                    </View>

                    <Pressable className="w-[70px] items-center active:opacity-50">
                      <MaterialIcons name="more-vert" size={20} color="#A1A1AA" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Pagination */}
            <View className="flex-row justify-between items-center p-6 bg-white flex-wrap gap-4 border-t border-gray-50">
              <Text className="text-gray-500 text-sm font-medium">Showing 1 to 5 of 42 entries</Text>
              
              <View className="flex-row items-center gap-1">
                <Pressable className="w-8 h-8 border border-gray-200 rounded-lg items-center justify-center active:bg-gray-50">
                  <MaterialIcons name="chevron-left" size={18} color="#A1A1AA" />
                </Pressable>
                
                <View className="w-8 h-8 rounded-lg bg-[#0F5238] items-center justify-center ml-1">
                  <Text className="text-white font-black text-xs">1</Text>
                </View>
                <Pressable className="w-8 h-8 rounded-lg items-center justify-center border border-transparent active:bg-gray-100">
                  <Text className="text-gray-600 font-bold text-xs">2</Text>
                </Pressable>
                <Pressable className="w-8 h-8 rounded-lg items-center justify-center border border-transparent active:bg-gray-100">
                  <Text className="text-gray-600 font-bold text-xs">3</Text>
                </Pressable>
                <View className="w-8 h-8 items-center justify-center">
                  <Text className="text-gray-400 font-bold text-xs">...</Text>
                </View>
                <Pressable className="w-8 h-8 rounded-lg items-center justify-center border border-transparent active:bg-gray-100">
                  <Text className="text-gray-600 font-bold text-xs">9</Text>
                </Pressable>

                <Pressable className="w-8 h-8 border border-gray-200 rounded-lg items-center justify-center ml-1 active:bg-gray-50">
                  <MaterialIcons name="chevron-right" size={18} color="#605F50" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Bottom Summary Cards */}
          <View className={`flex-row gap-6 ${!isDesktop && 'flex-col'}`}>
            
            {/* Card 1: Total Yield */}
            <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative min-h-[140px] justify-between">
              <View className="flex-row justify-between items-start">
                <Text className="text-[13px] font-bold text-gray-600">Total Yield (YTD)</Text>
                <View className="w-8 h-8 rounded-full bg-[#EAF5F0] items-center justify-center">
                  <MaterialIcons name="insert-chart" size={16} color="#2D6A4F" />
                </View>
              </View>
              <View>
                <Text className="text-3xl font-black font-serif text-[#1b1b1b] mt-2 mb-1">
                  5,160 <Text className="text-gray-400 text-lg font-bold">kg</Text>
                </Text>
                <Text className="text-xs font-bold text-[#0F5238]">↑ 12% vs last year</Text>
              </View>
            </View>

            {/* Card 2: Export Grade Quality */}
            <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative min-h-[140px] justify-between">
              <View className="flex-row justify-between items-start">
                <Text className="text-[13px] font-bold text-gray-600">Export Grade Quality</Text>
                <View className="w-8 h-8 rounded-full bg-[#EAF5F0] items-center justify-center">
                  <MaterialIcons name="verified" size={16} color="#2D6A4F" />
                </View>
              </View>
              <View>
                <Text className="text-3xl font-black font-serif text-[#1b1b1b] mt-2 mb-3">82%</Text>
                <View className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <View className="w-[82%] h-full bg-[#0F5238] rounded-full" />
                </View>
              </View>
            </View>

            {/* Card 3: Active Harvests */}
            <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative min-h-[140px] justify-between">
              <View className="flex-row justify-between items-start">
                <Text className="text-[13px] font-bold text-gray-600">Active Harvests</Text>
                <View className="w-8 h-8 rounded-full bg-[#EAF5F0] items-center justify-center">
                  <MaterialIcons name="agriculture" size={16} color="#2D6A4F" />
                </View>
              </View>
              <View>
                <Text className="text-3xl font-black font-serif text-[#1b1b1b] mt-2 mb-1">2</Text>
                <Text className="text-xs font-bold text-gray-400">Awaiting collection</Text>
              </View>
            </View>

          </View>
        </View>
        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}