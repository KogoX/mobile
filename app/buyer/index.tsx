import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native"

const logo = require("../../assets/cemslogo.svg")

const listings = [
  {
    name: "Kiambu Fruit Co-op",
    region: "Kiambu, Central",
    grade: "Grade A",
    variety: "Hass",
    quantity: "12.0 Tons",
    harvest: "Next 4 Days",
    price: "$1,180",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Rift Valley Growers",
    region: "Eldoret, RV",
    grade: "Grade B",
    variety: "Fuerte",
    quantity: "28.5 Tons",
    harvest: "Immediate",
    price: "$950",
    image: "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Embu Highlands Co-op",
    region: "Embu, Eastern",
    grade: "Grade A",
    variety: "Hass",
    quantity: "18.2 Tons",
    harvest: "Next 10 Days",
    price: "$1,210",
    image: "https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=900&q=80",
  },
]

export default function BuyerMarketplace() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= 860

  return (
    <ScrollView className="flex-1 bg-[#FCF9F8]" contentContainerStyle={{ paddingBottom: 44 }}>
      <TopBar active="Marketplace" onOrders={() => router.push("/buyer/orders")} />

      <View className="w-full max-w-[1160px] self-center p-5 gap-6">
        
        {/* Header Block */}
        <View className="mt-4">
          <Text className={`text-[#2A5C43] font-black ${isWide ? 'text-5xl leading-[56px]' : 'text-4xl leading-[42px]'}`}>
            Available Avocado Listings
          </Text>
          <Text className="text-gray-600 text-base md:text-lg max-w-3xl mt-2 leading-relaxed">
            Connect directly with Kenyan cooperatives. Premium Hass and Fuerte avocados ready for export.
          </Text>
        </View>

        {/* Filter Panel */}
        <View className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm gap-4 ${isWide ? 'flex-row items-end flex-wrap' : 'flex-col'}`}>
          <FilterField label="Region" value="All Regions" />
          <FilterField label="Grade" value="Grade A Premium" />
          <FilterField label="Quantity" value="Min. 5 Tons" input />
          <FilterField label="Availability" value="Available Now" />
          <Pressable className="min-h-[48px] rounded-full bg-[#2A5C43] px-6 flex-row items-center justify-center gap-2 active:opacity-80">
            <MaterialIcons name="filter-alt" size={19} color="#ffffff" />
            <Text className="text-white font-black text-sm">Apply Filters</Text>
          </Pressable>
        </View>

        {/* Featured Harvest */}
        <View className={`bg-[#2A5C43] rounded-3xl overflow-hidden shadow-md ${isWide ? 'flex-row' : 'flex-col'}`}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=1200&q=80" }}
            className={isWide ? 'w-[48%] h-auto min-h-[360px]' : 'w-full h-64'}
            contentFit="cover"
          />
          <View className="flex-1 p-8 justify-center">
            <Text className="self-start bg-[#A3E635] text-[#1b4332] rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest mb-4">
              Featured Harvest
            </Text>
            <Text className="text-[#b1f0ce] text-3xl md:text-4xl font-black mb-6 leading-tight">
              Mount Kenya Organic Cooperative
            </Text>
            <View className="flex-row flex-wrap gap-4 mb-8">
              <FeatureStat label="Grade" value="Grade A Premium Hass" />
              <FeatureStat label="Quantity" value="45.5 Metric Tons" />
              <FeatureStat label="Location" value="Nyeri, Central Kenya" />
              <FeatureStat label="Price" value="$1,250 / Ton" />
            </View>
            <Pressable className="self-start bg-white rounded-full px-6 py-3.5 shadow-sm active:opacity-80">
              <Text className="text-[#2A5C43] font-black text-sm">Place Order Now</Text>
            </Pressable>
          </View>
        </View>

        {/* Listing Grid */}
        <View className={`gap-5 ${isWide ? 'flex-row flex-wrap' : 'flex-col'}`}>
          {listings.map((item) => (
            <View key={item.name} className="flex-1 min-w-[280px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <View className="h-48 relative">
                <Image source={{ uri: item.image }} className="w-full h-full" contentFit="cover" />
                <View className="absolute top-3 right-3 bg-white/95 rounded-full px-3 py-1.5 shadow-sm">
                  <Text className="text-[#2A5C43] font-black text-xs">{item.variety}</Text>
                </View>
              </View>
              
              <View className="p-5">
                <View className="flex-row justify-between items-start gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-[#2A5C43] text-xl font-black mb-1">{item.name}</Text>
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons name="location-on" size={14} color="#71717A" />
                      <Text className="text-gray-500 text-xs font-medium">{item.region}</Text>
                    </View>
                  </View>
                  <Text className="text-[#005236] bg-[#a0f4c8] px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide">
                    {item.grade}
                  </Text>
                </View>

                <InfoRow label="Available Quantity" value={item.quantity} />
                <InfoRow label="Harvest Date" value={item.harvest} />
                <InfoRow label="Price per Ton" value={item.price} strong />

                <Pressable className="border-2 border-[#2A5C43] rounded-full py-3 items-center mt-4 active:bg-[#2A5C43]/5">
                  <Text className="text-[#2A5C43] font-black text-sm">Place Order</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

      </View>
    </ScrollView>
  )
}

function TopBar({ active, onOrders }: { active: string; onOrders: () => void }) {
  return (
    <View className="min-h-[72px] px-6 border-b border-[#EAEAEA] bg-white flex-row items-center justify-between gap-4 shadow-sm z-10">
      <View className="flex-row items-center gap-2">
        <Image source={logo} style={{ width: 24, height: 24 }} contentFit="contain" tintColor="#2A5C43" />
        <Text className="text-[#2A5C43] text-xl font-black tracking-wide">CEMS</Text>
      </View>
      <View className="flex-row gap-6 items-center">
        <Text className="text-[#2A5C43] font-black text-sm underline underline-offset-4">{active}</Text>
        <Pressable onPress={onOrders} className="active:opacity-60">
          <Text className="text-gray-500 font-bold text-sm">Orders</Text>
        </Pressable>
      </View>
    </View>
  )
}

function FilterField({ label, value, input }: { label: string; value: string; input?: boolean }) {
  return (
    <View className="flex-1 min-w-[150px]">
      <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      {input ? (
        <TextInput 
          className="min-h-[48px] rounded-xl bg-[#F9F9F9] px-4 text-gray-800 font-bold border border-gray-100" 
          placeholder={value} 
          placeholderTextColor="#A1A1AA" 
          style={{ outlineStyle: 'none' } as never}
        />
      ) : (
        <Pressable className="min-h-[48px] rounded-xl bg-[#F9F9F9] px-4 flex-row items-center justify-between border border-gray-100 active:bg-gray-100">
          <Text className="text-gray-800 font-bold text-sm">{value}</Text>
          <MaterialIcons name="expand-more" size={20} color="#71717A" />
        </Pressable>
      )}
    </View>
  )
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-[45%]">
      <Text className="text-[#A3E635] text-[10px] font-black uppercase tracking-widest mb-1">
        {label}
      </Text>
      <Text className="text-white text-sm font-bold">
        {value}
      </Text>
    </View>
  )
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between items-center mb-2.5 gap-3">
      <Text className="text-gray-500 text-xs font-medium">{label}</Text>
      <Text className={`text-sm ${strong ? 'text-[#2A5C43] font-black' : 'text-gray-800 font-bold'}`}>
        {value}
      </Text>
    </View>
  )
}