import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native"
import { useState, useEffect } from "react"

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Processing: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", dot: "bg-[#D97706]" },
  "In Transit": { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", dot: "bg-[#2563EB]" },
  Delivered: { bg: "bg-[#DCFCE7]", text: "text-[#166534]", dot: "bg-[#16A34A]" },
  Cancelled: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", dot: "bg-[#DC2626]" },
}

export default function BuyerOrders() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= 780

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/orders")
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#FCF9F8]" contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* Upper Navigation Header */}
      <View className="min-h-[64px] px-6 border-b border-[#E9EDE9] flex-row items-center justify-between bg-[#FCF9F8]">
        <View className="flex-row items-center gap-3">
          <Pressable 
            className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100" 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2D6A4F" />
          </Pressable>
          <Text className="text-[#2D6A4F] text-xl font-black">Order History</Text>
        </View>
        <Pressable className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100">
          <MaterialIcons name="filter-list" size={24} color="#2D6A4F" />
        </Pressable>
      </View>

      {/* Main Workspace Workspace Container */}
      <View className="w-full max-w-[980px] self-center p-5 gap-6">
        
        {/* Search & Filter Toolbar Panel */}
        <View className={`bg-white rounded-2xl p-4 gap-3 shadow-sm border border-gray-100/50 ${isWide ? 'flex-row items-center' : 'flex-col'}`}>
          <View className="flex-[2] min-h-[50px] border border-[#BFC9C1] rounded-xl flex-row items-center gap-3 px-4 focus-within:border-[#2D6A4F]">
            <MaterialIcons name="search" size={22} color="#707973" />
            <TextInput
              className="flex-1 text-gray-800 font-medium text-sm"
              placeholder="Search by Order ID or Cooperative..."
              placeholderTextColor="#707973"
              style={{ outlineStyle: "none" as never }}
            />
          </View>
          
          <View className="flex-1 min-h-[50px] border border-[#BFC9C1] rounded-xl px-4 flex-row items-center justify-between active:bg-gray-50">
            <Text className="text-[#404943] font-extrabold text-sm">All Dates</Text>
            <MaterialIcons name="expand-more" size={22} color="#707973" />
          </View>
        </View>

        {/* Detailed Orders Feed List */}
        <View className="gap-5">
          {orders.map((order) => {
            const currentStyle = statusStyles[order.status] || statusStyles["Processing"];
            
            return (
              <View key={order.id} className="bg-white border border-[#E9EDE9] rounded-2xl p-5 shadow-sm">
                
                {/* Header Information Row inside Card */}
                <View className={`pb-4 mb-4 border-b border-[#E9EDE9] gap-3 ${isWide ? 'flex-row items-center justify-between' : 'flex-col'}`}>
                  <View>
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Order ID</Text>
                    <Text className="text-[#0F5238] text-xl font-black font-mono">{order.id}</Text>
                  </View>
                  
                  {/* Visual Dynamic Status Pill Component */}
                  <View className={`self-start rounded-full px-3.5 py-1.5 flex-row items-center gap-2 ${currentStyle.bg}`}>
                    <View className={`w-2 h-2 rounded-full ${currentStyle.dot}`} />
                    <Text className={`text-xs font-black tracking-wide ${currentStyle.text}`}>{order.status}</Text>
                  </View>
                </View>

                {/* Metrics Context Details Information Block Grid */}
                <View className={`gap-y-4 gap-x-2 mb-4 ${isWide ? 'flex-row flex-wrap justify-between' : 'flex-col'}`}>
                  <DetailItem label="Buyer/Cooperative" value={order.buyer || order.coop || "N/A"} isBold isWide={isWide} />
                  <DetailItem label="Produce Type" value={order.produce || "Grade A Hass Avocados"} isWide={isWide} />
                  <DetailItem label="Quantity" value={order.quantity} isWide={isWide} />
                  <DetailItem label="Total Amount" value={order.amount || "TBD"} isPrice isWide={isWide} />
                  <DetailItem label="Order Date" value={order.date} isWide={isWide} />
                </View>

                {/* Footer Dynamic Execution Action Row Component */}
                <View className="border-t border-[#E9EDE9] pt-4 flex-row flex-wrap gap-3 items-center">
                  {order.status !== "Delivered" && order.status !== "Cancelled" && (
                    <Pressable className="bg-[#0F5238] rounded-full px-5 py-2.5 shadow-sm active:opacity-80">
                      <Text className="text-white font-black text-xs">Track Order</Text>
                    </Pressable>
                  )}
                  
                  <Pressable className="border border-[#0F5238] rounded-full px-5 py-2.5 active:bg-gray-50">
                    <Text className="text-[#0F5238] font-black text-xs">
                      {order.status === "Cancelled" ? "Re-order" : "View Details"}
                    </Text>
                  </Pressable>
                  
                  <Pressable className="flex-row items-center gap-1.5 px-3 py-2.5 ml-auto active:opacity-60">
                    <MaterialIcons name="description" size={18} color="#707973" />
                    <Text className="text-[#707973] font-black text-xs">Invoice</Text>
                  </Pressable>
                </View>

              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

function DetailItem({ label, value, isBold, isPrice, isWide }: { label: string; value: string; isBold?: boolean; isPrice?: boolean; isWide: boolean }) {
  return (
    <View style={{ minWidth: isWide ? 170 : '100%' }} className="flex-1">
      <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</Text>
      <Text className={`text-sm ${
        isPrice ? 'text-[#0F5238] text-[17px] font-black' : 
        isBold ? 'text-gray-900 font-black' : 
        'text-gray-700 font-semibold'
      }`}>
        {value}=
      </Text>
    </View>
  )
}