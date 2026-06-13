import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { ScrollView, Text, useWindowDimensions, View, Pressable } from "react-native"
import { useState, useEffect } from "react"

import { ManagerButton, ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const summary = [
  {
    label: "Total Farmers",
    value: "1,284",
    hint: "+12% from last month",
    color: "text-[#0F5238]",
    icon: "water-drop",
    watermarkColor: "#F0F7F4"
  },
  {
    label: "Pending Verification",
    value: "42",
    hint: "Requires document review",
    color: "text-[#D97706]",
    icon: "assignment",
    watermarkColor: "#FFF8ED"
  },
  {
    label: "Suspended",
    value: "5",
    hint: "View compliance issues",
    color: "text-[#BA1A1A]",
    icon: null,
    watermarkColor: "transparent"
  },
]

export default function ManagerFarmers() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 1000

  const [farmers, setFarmers] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/farmers")
      .then(res => res.json())
      .then(data => setFarmers(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <ManagerLayout 
      active="Farmers" 
      title="Farmer Registry" 
      subtitle="Manage and monitor the registered farmers in the Kiambu export sector." 
      action={<ManagerButton icon="person-add" label="Add New Farmer" />}
    >
      <ScrollView className="flex-1 bg-[#FCF9F8]">
        <View className="p-8 pb-16 w-full max-w-[1200px] self-center">
          
          {/* Header */}
          <View className={`flex-row justify-between items-end mb-10 ${!isDesktop && 'flex-col items-start gap-4'}`}>
            <View>
              <Text className="text-5xl font-black text-[#0F5238] font-serif mb-2">Farmer Registry</Text>
              <Text className="text-gray-600 text-base">Manage and monitor the registered farmers in the Kiambu export sector.</Text>
            </View>
            <Text className="text-gray-500 text-xs font-black uppercase tracking-widest">Export Season: 2024 Phase A</Text>
          </View>

          {/* Summary Cards */}
          <View className={`flex-row gap-6 mb-10 ${!isDesktop && 'flex-col'}`}>
            {summary.map((item, index) => (
              <View key={item.label} className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden min-h-[160px] justify-between">
                <Text className="text-xs font-black text-gray-500 uppercase tracking-widest">{item.label}</Text>
                
                <View>
                  <Text className={`text-4xl font-black font-serif mt-3 ${item.color}`}>
                    {item.value}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-2">
                    {index === 0 && <MaterialIcons name="trending-up" size={16} color="#0F5238" />}
                    <Text className={`text-xs font-black ${index === 2 ? 'text-[#BA1A1A] underline' : index === 0 ? 'text-[#0F5238]' : 'text-gray-500'}`}>
                      {item.hint}
                    </Text>
                  </View>
                </View>

                {item.icon && (
                  <MaterialIcons 
                    name={item.icon as any} 
                    size={110} 
                    color={item.watermarkColor} 
                    style={{ position: 'absolute', right: -20, bottom: -20, zIndex: -1 }} 
                  />
                )}
              </View>
            ))}
          </View>

          {/* Registry Table Card */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Filters Row */}
            <View className="flex-row justify-between items-center p-5 border-b border-gray-100 flex-wrap gap-4">
              <View className="flex-row gap-4">
                <Pressable className="flex-row items-center border border-gray-200 rounded-lg px-4 py-2 gap-2 bg-[#FAFAF9] active:bg-gray-100">
                  <MaterialIcons name="filter-list" size={18} color="#605F50" />
                  <Text className="font-bold text-gray-600 text-sm">Filter Status</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color="#605F50" />
                </Pressable>
                <Pressable className="flex-row items-center border border-gray-200 rounded-lg px-4 py-2 gap-2 bg-[#FAFAF9] active:bg-gray-100">
                  <MaterialIcons name="place" size={18} color="#605F50" />
                  <Text className="font-bold text-gray-600 text-sm">Region: All</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color="#605F50" />
                </Pressable>
              </View>
              <Text className="text-xs text-gray-400 font-bold">Showing 1-10 of 1,284 farmers</Text>
            </View>

            {/* Table Area */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="min-w-[1000px] w-full">
                
                {/* Table Header */}
                <View className="flex-row bg-[#FAFAF9]/60 border-b border-gray-100 py-4 px-6">
                  <Text className="w-[28%] text-gray-500 text-xs font-black uppercase tracking-wider">Farmer Name</Text>
                  <Text className="w-[15%] text-gray-500 text-xs font-black uppercase tracking-wider">Farmer ID</Text>
                  <Text className="w-[18%] text-gray-500 text-xs font-black uppercase tracking-wider">Location</Text>
                  <Text className="w-[16%] text-gray-500 text-xs font-black uppercase tracking-wider">Verification Status</Text>
                  <Text className="w-[13%] text-gray-500 text-xs font-black uppercase tracking-wider">Yield YTD (kg)</Text>
                  <Text className="w-[10%] text-gray-500 text-xs font-black uppercase tracking-wider text-right">Actions</Text>
                </View>

                {/* Table Rows */}
                {farmers.map((farmer, idx) => (
                  <View key={farmer.id} className={`flex-row items-center py-5 px-6 border-b border-gray-50`}>
                    
                    {/* Name & Avatar */}
                    <View className="w-[28%] flex-row items-center gap-3 pr-4">
                      <View className="w-10 h-10 rounded-full bg-[#EAEAEA] items-center justify-center overflow-hidden border border-gray-100">
                        {farmer.avatar ? (
                          <Image source={{ uri: farmer.avatar }} className="w-full h-full" contentFit="cover" />
                        ) : (
                          <Text className="text-gray-400 font-black text-xs">{farmer.name?.slice(0, 2).toUpperCase() || 'NA'}</Text>
                        )}
                      </View>
                      <View>
                        <Text className="text-[#0F5238] font-black text-[15px]">{farmer.name}</Text>
                        <Text className="text-gray-500 text-xs mt-0.5">{farmer.added || "Added Recently"}</Text>
                      </View>
                    </View>

                    {/* ID */}
                    <Text className="w-[15%] text-gray-600 font-medium text-sm pr-2">{farmer.id}</Text>
                    
                    {/* Location */}
                    <Text className="w-[18%] text-gray-500 text-sm pr-2">{farmer.location}</Text>

                    {/* Status Badge */}
                    <View className="w-[16%] items-start">
                      <View className={`px-3 py-1.5 rounded-full ${
                        farmer.status === 'Verified' || farmer.status === 'Active' ? 'bg-[#D1F4E0]' : 
                        farmer.status === 'Pending' ? 'bg-[#FEF3C7]' : 
                        farmer.status === 'Flagged' ? 'bg-[#FFEDD5]' : 
                        'bg-[#FFDAD6]'
                      }`}>
                        <Text className={`text-[11px] font-black tracking-wide ${
                          farmer.status === 'Verified' || farmer.status === 'Active' ? 'text-[#0F5238]' : 
                          farmer.status === 'Pending' ? 'text-[#B45309]' : 
                          farmer.status === 'Flagged' ? 'text-[#C2410C]' : 
                          'text-[#991B1B]'
                        }`}>
                          {farmer.status}
                        </Text>
                      </View>
                    </View>

                    {/* Yield */}
                    <Text className="w-[13%] text-[#0F5238] font-black text-sm">{farmer.yieldKg || farmer.yield || "0 kg"}</Text>

                    {/* Action */}
                    <Pressable className="w-[10%] flex-row justify-end items-center gap-2 active:opacity-60">
                      <Text className="text-[#0F5238] font-black text-[13px]">{farmer.action || "View Details"}</Text>
                      <MaterialIcons name="edit" size={14} color="#A1A1AA" />
                    </Pressable>

                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Pagination */}
            <View className="flex-row justify-between items-center p-6 bg-white flex-wrap gap-4">
              <Pressable className="flex-row items-center border border-gray-200 rounded-lg px-4 py-2 gap-1 opacity-50">
                <MaterialIcons name="chevron-left" size={18} color="#A1A1AA" />
                <Text className="text-gray-400 font-bold text-sm">Previous</Text>
              </Pressable>
              
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 rounded-lg bg-[#0F5238] items-center justify-center">
                  <Text className="text-white font-black">1</Text>
                </View>
                <Pressable className="w-9 h-9 rounded-lg items-center justify-center active:bg-gray-100">
                  <Text className="text-gray-600 font-bold">2</Text>
                </Pressable>
                <Pressable className="w-9 h-9 rounded-lg items-center justify-center active:bg-gray-100">
                  <Text className="text-gray-600 font-bold">3</Text>
                </Pressable>
                <View className="w-9 h-9 items-center justify-center">
                  <Text className="text-gray-400 font-bold">...</Text>
                </View>
                <Pressable className="w-9 h-9 rounded-lg items-center justify-center active:bg-gray-100">
                  <Text className="text-gray-600 font-bold">128</Text>
                </Pressable>
              </View>

              <Pressable className="flex-row items-center border border-gray-200 rounded-lg px-4 py-2 gap-1 active:bg-gray-50">
                <Text className="text-gray-600 font-bold text-sm">Next</Text>
                <MaterialIcons name="chevron-right" size={18} color="#605F50" />
              </Pressable>
            </View>

          </View>
        </View>
        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}