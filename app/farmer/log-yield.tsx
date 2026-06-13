import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function LogYield() {
  const [season, setSeason] = useState("Main Season 2024");
  const [quantity, setQuantity] = useState("");
  const [grade, setGrade] = useState("A");
  const [date, setDate] = useState("2024-06-15");

  const handleSubmit = async () => {
    if (!quantity) return;
    try {
      const res = await fetch("http://localhost:5000/api/yields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropSeason: season,
          quantity: parseInt(quantity),
          grade,
          date
        })
      });
      if (res.ok) {
        alert("Yield logged successfully!");
        setQuantity("");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to log yield");
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#FCF9F8] p-5">
      <View className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <Text className="text-[#2A5C43] text-2xl font-black mb-4">Log New Harvest</Text>
        
        <View className="mt-4">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Crop Season</Text>
          <TextInput 
            className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 text-gray-800 font-bold" 
            value={season}
            onChangeText={setSeason}
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Quantity (Kilograms)</Text>
          <TextInput 
            className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 text-gray-800 font-bold" 
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>
        
        <View className="mt-4 mb-2">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Produce Grade</Text>
          <View className="flex-row gap-3">
            {["A", "B", "C"].map((g) => (
              <Pressable 
                key={g} 
                onPress={() => setGrade(g)}
                className={`flex-1 border rounded-xl py-3 items-center ${
                  grade === g ? 'bg-[#2A5C43] border-[#2A5C43]' : 'bg-[#F9F9F9] border-gray-200'
                }`}
              >
                <Text className={`font-black ${grade === g ? 'text-white' : 'text-gray-500'}`}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        <View className="mt-4">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Harvest Date</Text>
          <TextInput 
            className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 text-gray-800 font-bold" 
            value={date}
            onChangeText={setDate}
          />
        </View>
        
        <Pressable 
          onPress={handleSubmit}
          className="mt-6 bg-[#2A5C43] rounded-full min-h-[54px] flex-row items-center justify-center gap-2 active:opacity-80"
        >
          <MaterialIcons name="add-task" size={20} color="#ffffff" />
          <Text className="text-white font-black text-sm">Submit Yield Record</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
