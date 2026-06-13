import { useState, useEffect } from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";

export default function Payments() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  
  const [payments, setPayments] = useState<{id: string, buyer: string, quantity: string, amount: string, status: string}[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/payments")
      .then(res => res.json())
      .then(data => setPayments(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#FCF9F8] p-5">
      <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <View className="bg-[#FAFAFA] p-6 border-b border-gray-100">
          <Text className="text-[#2A5C43] text-2xl font-black">All Payments</Text>
          <Text className="text-gray-500 font-medium text-sm mt-1">Track settlements from international buyers</Text>
        </View>
        
        <View className="p-2">
          {payments.map(({ id, buyer, quantity, amount, status }, i) => (
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
    </ScrollView>
  );
}
