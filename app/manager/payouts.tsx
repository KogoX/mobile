import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, Text, useWindowDimensions, View, Pressable, TextInput } from "react-native"
import { useState, useEffect } from "react"

import { ManagerButton, ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const summaryCards = [
  {
    title: "Current Season Earnings",
    value: "$45,250.00",
    hint: "+12.5% from last season",
    icon: "account-balance-wallet",
    color: "text-[#0F5238]"
  },
  {
    title: "Pending Payments",
    value: "$3,840.50",
    hint: "Expected clearance in 3-5 business days",
    icon: "pending-actions",
    color: "text-[#0F5238]"
  },
  {
    title: "Total Disbursed",
    value: "$124,500.00",
    hint: "Lifetime earnings since 2021",
    icon: "check-circle-outline",
    color: "text-[#0F5238]"
  },
]

export default function ManagerPayouts() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 980

  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/payments")
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <ManagerLayout
      active="Payments"
      title="Payments Dashboard"
      subtitle="Financial overview and transaction history for the current season."
      action={<ManagerButton icon="file-download" label="Download Statement" variant="outline" />}
    >
      <ScrollView className="flex-1 bg-[#FCF9F8]">
        <View className="p-8 pb-16 w-full max-w-[1100px] self-center">
          
          {/* Header Section */}
          <View className={`flex-row justify-between items-end mb-10 ${!isDesktop && 'flex-col items-start gap-4'}`}>
            <View>
              <Text className="text-4xl md:text-5xl font-black text-[#1b1b1b] font-serif mb-2">
                Payments Dashboard
              </Text>
              <Text className="text-gray-600 text-[15px]">
                Financial overview and transaction history for the current season.
              </Text>
            </View>
          </View>

          {/* Summary Cards */}
          <View className={`flex-row gap-6 mb-10 ${!isDesktop && 'flex-col'}`}>
            {summaryCards.map((card) => (
              <View 
                key={card.title} 
                className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden min-h-[180px] justify-between"
              >
                <View className="flex-row justify-between items-start gap-4">
                  <Text className="text-2xl font-black text-[#1b1b1b] font-serif flex-1 leading-8">
                    {card.title}
                  </Text>
                  <View className="w-10 h-10 rounded-full bg-[#EAF5F0] items-center justify-center">
                    <MaterialIcons name={card.icon as never} size={20} color="#2D6A4F" />
                  </View>
                </View>

                <View className="mt-4">
                  <Text className={`text-4xl font-black font-serif ${card.color}`}>
                    {card.value}
                  </Text>
                  <Text className="text-gray-500 text-[13px] mt-2 font-medium">
                    {card.hint}
                  </Text>
                </View>

                {/* Decorative Bottom Right Watermark (Water drop shape imitation) */}
                <View className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#F4F9F6] rounded-tl-[60px] rounded-br-[60px] rounded-tr-[60px] rounded-bl-lg transform rotate-45 z-[-1]" />
              </View>
            ))}
          </View>

          {/* Recent Transactions Table */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
            
            {/* Table Header / Search */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-100 flex-wrap gap-4">
              <Text className="text-3xl font-black text-[#1b1b1b] font-serif">
                Recent Transactions
              </Text>
              
              <View className="flex-row items-center gap-4">
                <View className="min-w-[240px] border border-gray-200 rounded-full px-4 flex-row items-center gap-2 h-10 bg-white">
                  <MaterialIcons name="search" size={18} color="#A1A1AA" />
                  <TextInput 
                    className="flex-1 text-gray-800 text-[13px] font-medium"
                    placeholder="Search orders..."
                    placeholderTextColor="#A1A1AA"
                    style={{ outlineStyle: 'none' } as never}
                  />
                </View>
                <Pressable className="active:opacity-60">
                  <MaterialIcons name="filter-list" size={22} color="#4A4A4A" />
                </Pressable>
              </View>
            </View>

            {/* Scrollable Table Area */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="min-w-[950px] w-full">
                
                {/* Column Headers */}
                <View className="flex-row bg-[#FAFAF9]/50 border-b border-gray-100 py-5 px-6">
                  <Text className="w-[140px] text-gray-500 text-[10px] font-black uppercase tracking-widest">Date</Text>
                  <Text className="w-[140px] text-gray-500 text-[10px] font-black uppercase tracking-widest">Order ID</Text>
                  <Text className="w-[200px] text-gray-500 text-[10px] font-black uppercase tracking-widest">Buyer</Text>
                  <Text className="w-[120px] text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Quantity (kg)</Text>
                  <Text className="w-[120px] text-gray-500 text-[10px] font-black uppercase tracking-widest text-right">Amount</Text>
                  <Text className="w-[130px] text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Status</Text>
                  <Text className="w-[60px]"></Text>
                </View>

                {/* Rows */}
                {transactions.map((row) => (
                  <View key={row.order || row.id} className="flex-row items-center py-5 px-6 border-b border-gray-50 hover:bg-gray-50">
                    <Text className="w-[140px] text-gray-600 text-[13px] font-medium">{row.date || "Recent"}</Text>
                    <Text className="w-[140px] text-gray-800 text-[13px] font-black tracking-wide">{row.order || row.id}</Text>
                    <Text className="w-[200px] text-gray-600 text-[13px] font-medium">{row.buyer}</Text>
                    <Text className="w-[120px] text-gray-800 text-[13px] font-medium text-center">{row.qty || row.quantity}</Text>
                    <Text className="w-[120px] text-gray-800 text-[13px] font-black text-right">{row.amount}</Text>
                    
                    <View className="w-[130px] items-center">
                      <View className={`px-4 py-1.5 rounded-full ${
                        row.status === 'Disbursed' || row.status === 'Verified' ? 'bg-[#D1F4E0]' : 
                        row.status === 'Processing' || row.status === 'Pending' ? 'bg-[#EAEAEA]' : 
                        'bg-[#FFDAD6]'
                      }`}>
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${
                          row.status === 'Disbursed' || row.status === 'Verified' ? 'text-[#0F5238]' : 
                          row.status === 'Processing' || row.status === 'Pending' ? 'text-[#4A4A4A]' : 
                          'text-[#BA1A1A]'
                        }`}>
                          {row.status}
                        </Text>
                      </View>
                    </View>

                    <Pressable className="w-[60px] items-end active:opacity-50">
                      <MaterialIcons name="more-vert" size={20} color="#2D6A4F" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Pagination */}
            <View className="flex-row justify-between items-center p-6 bg-white flex-wrap gap-4 border-t border-gray-50">
              <Text className="text-gray-500 text-[13px] font-medium">Showing 1-4 of 24 transactions</Text>
              
              <View className="flex-row items-center gap-2">
                <Pressable className="w-8 h-8 border border-gray-200 rounded-lg items-center justify-center active:bg-gray-50">
                  <MaterialIcons name="chevron-left" size={18} color="#A1A1AA" />
                </Pressable>
                <Pressable className="w-8 h-8 border border-gray-200 rounded-lg items-center justify-center active:bg-gray-50">
                  <MaterialIcons name="chevron-right" size={18} color="#4A4A4A" />
                </Pressable>
              </View>
            </View>

          </View>
        </View>
        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}