import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, Text, useWindowDimensions, View, Pressable } from "react-native"

import { ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const profileData = {
  personal: [
    { label: "Full Legal Name", value: "Samuel Kamau Njoroge" },
    { label: "Phone Number", value: "+254 712 345 678" },
    { label: "Email Address", value: "s.kamau@example.com" },
    { label: "Registered Village / Ward", value: "Githunguri, Kiambu County", fullWidth: true },
  ],
  farm: [
    { label: "Total Acreage", value: "4.5 Acres" },
    { label: "Number of Trees", value: "850 Active" },
    { label: "Primary Crop Type", value: "Hass Avocado", fullWidth: true },
    { label: "Farm Coordinates", value: "-1.0333, 36.7833", isCode: true, fullWidth: true },
  ],
  documents: [
    { 
      title: "National ID", 
      copy: "Front and back scan verified by authorities.", 
      status: "VERIFIED", 
      icon: "badge" 
    },
    { 
      title: "Title Deed", 
      copy: "Proof of land ownership currently under review.", 
      status: "PENDING REVIEW", 
      icon: "description" 
    },
  ]
}

export default function ManagerSettings() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= 980

  return (
    <ManagerLayout active="Settings">
      <ScrollView className="flex-1 bg-[#FCF9F8]">
        <View className="p-8 pb-16 w-full max-w-[1100px] self-center">
          
          {/* Header Section */}
          <View className={`flex-row justify-between items-end mb-10 ${!isDesktop && 'flex-col items-start gap-4'}`}>
            <View>
              <Text className="text-4xl md:text-5xl font-black text-[#1b1b1b] font-serif mb-2">
                Profile & Settings
              </Text>
              <Text className="text-gray-600 text-[15px]">
                Manage your personal information and farm documentation.
              </Text>
            </View>
            <Pressable className="bg-[#2A5C43] rounded-full px-6 py-3 flex-row items-center gap-2 active:opacity-80">
              <MaterialIcons name="edit" size={16} color="#ffffff" />
              <Text className="text-white font-bold text-sm">Edit Profile</Text>
            </Pressable>
          </View>

          {/* Details Cards Grid */}
          <View className={`flex-row gap-6 mb-12 ${!isDesktop && 'flex-col'}`}>
            
            {/* Personal Details Card */}
            <View className="flex-1 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden min-h-[300px]">
              <View className="flex-row items-center gap-4 border-b border-gray-100 pb-6 mb-6 z-10">
                <View className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-gray-200 items-center justify-center">
                  <MaterialIcons name="person-outline" size={24} color="#2A5C43" />
                </View>
                <Text className="text-2xl font-black text-[#1b1b1b] font-serif">Personal Details</Text>
              </View>

              <View className="flex-row flex-wrap gap-y-6 z-10">
                {profileData.personal.map((item) => (
                  <View key={item.label} className={item.fullWidth ? 'w-full' : 'w-1/2 pr-4'}>
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      {item.label}
                    </Text>
                    <Text className="text-gray-800 text-[15px] font-bold">
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Decorative Background Icon */}
              <MaterialIcons name="eco" size={160} color="#F4F9F6" style={{ position: 'absolute', right: -20, bottom: -20, zIndex: 0 }} />
            </View>

            {/* Farm Details Card */}
            <View className="flex-1 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden min-h-[300px]">
              <View className="flex-row items-center gap-4 border-b border-gray-100 pb-6 mb-6 z-10">
                <View className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-gray-200 items-center justify-center">
                  <MaterialIcons name="landscape" size={24} color="#2A5C43" />
                </View>
                <Text className="text-2xl font-black text-[#1b1b1b] font-serif">Farm Details</Text>
              </View>

              <View className="flex-row flex-wrap gap-y-6 z-10">
                {profileData.farm.map((item) => (
                  <View key={item.label} className={item.fullWidth ? 'w-full' : 'w-1/2 pr-4'}>
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      {item.label}
                    </Text>
                    {item.isCode ? (
                      <View className="bg-[#F9F9F9] border border-gray-200 self-start px-2 py-1 rounded">
                        <Text className="text-gray-600 text-sm font-medium font-mono tracking-wider">
                          {item.value}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-gray-800 text-[15px] font-bold">
                        <Text className="font-black text-base">{item.value.split(' ')[0]}</Text> {item.value.substring(item.value.indexOf(' ') + 1)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Decorative Background Icon */}
              <MaterialIcons name="agriculture" size={160} color="#F4F9F6" style={{ position: 'absolute', right: -20, bottom: -20, zIndex: 0 }} />
            </View>

          </View>

          {/* Compliance Documents Section */}
          <View>
            <View className="flex-row items-center gap-3 mb-6">
              <MaterialIcons name="verified" size={28} color="#2A5C43" />
              <Text className="text-3xl md:text-4xl font-black text-[#1b1b1b] font-serif">
                Compliance Documents
              </Text>
            </View>

            <View className={`flex-row gap-6 ${!isDesktop && 'flex-col'}`}>
              {profileData.documents.map((doc) => (
                <View key={doc.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full md:w-[320px] justify-between min-h-[200px]">
                  
                  <View>
                    <View className="flex-row justify-between items-start mb-6">
                      <View className="w-10 h-10 rounded-full bg-[#EAF5F0] items-center justify-center">
                        <MaterialIcons name={doc.icon as never} size={20} color="#2A5C43" />
                      </View>
                      <View className={`px-3 py-1.5 rounded-full ${doc.status === 'VERIFIED' ? 'bg-[#D1F4E0]' : 'bg-[#EAEAEA]'}`}>
                        <Text className={`text-[10px] font-black tracking-widest ${doc.status === 'VERIFIED' ? 'text-[#0F5238]' : 'text-gray-500'}`}>
                          {doc.status}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xl font-black text-[#1b1b1b] font-serif mb-2">{doc.title}</Text>
                    <Text className="text-gray-500 text-[13px] leading-relaxed pr-4">
                      {doc.copy}
                    </Text>
                  </View>

                  <Pressable className="flex-row items-center gap-1.5 mt-6 border-t border-gray-100 pt-4 active:opacity-60">
                    <Text className="text-[#2A5C43] font-black text-xs">
                      {doc.status === 'VERIFIED' ? 'View Document' : 'Replace File'}
                    </Text>
                    <MaterialIcons name={doc.status === 'VERIFIED' ? 'arrow-forward' : 'file-upload'} size={14} color="#2A5C43" />
                  </Pressable>

                </View>
              ))}
            </View>
          </View>

        </View>
        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}