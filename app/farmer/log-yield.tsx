import { useState } from "react";
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

const MAX_PHOTOS = 5

export default function LogYield() {
  const [season, setSeason] = useState("Main Season 2026");
  const [quantity, setQuantity] = useState("");
  const [grade, setGrade] = useState("A");
  const [date, setDate] = useState("15/06/2026");
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  async function capturePhoto(useCamera: boolean) {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Photo limit reached", `You can upload up to ${MAX_PHOTOS} photos per yield.`)
      return
    }

    let permission
    if (useCamera) {
      permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow camera access to capture harvest photos.")
        return
      }
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo access to attach harvest photos.")
        return
      }
    }

    let result: ImagePicker.ImagePickerResult
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.45,
        cameraType: ImagePicker.CameraType.back
      })
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.45,
        selectionLimit: MAX_PHOTOS - photos.length
      })
    }

    if (result.canceled) return

    const selected = result.assets
      .slice(0, MAX_PHOTOS - photos.length)
      .map((asset) =>
        asset.base64 ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}` : asset.uri
      )

    setPhotos((current) => [...current, ...selected].slice(0, MAX_PHOTOS))
  }

  const handleSubmit = async () => {
    if (!quantity) {
      Alert.alert("Missing quantity", "Please enter a yield quantity.")
      return
    }

    try {
      setLoading(true)
      await api.post("/yields", {
        cropSeason: season,
        quantity: Number(quantity),
        grade,
        date: toApiDate(date),
        photos
      })
      Alert.alert("Saved", "Yield logged successfully.")
      setQuantity("")
      setPhotos([])
    } catch (err: any) {
      Alert.alert("Failed to log yield", err?.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
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
            placeholder="dd/mm/yyyy"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 ml-1">Upload Sample & Farm State</Text>
          <Text className="text-gray-400 text-[10px] font-bold mb-3 ml-1 leading-tight">Add pictures of the harvest sample and farm condition to help the manager plan pickup & delivery.</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => capturePhoto(false)}
              className="flex-1 min-h-[54px] rounded-xl border border-dashed border-[#2A5C43] bg-[#F4FBF7] flex-row items-center justify-center gap-2"
            >
              <MaterialIcons name="add-photo-alternate" size={22} color="#2A5C43" />
              <Text className="text-[#2A5C43] font-black">
                {photos.length ? `Library (${photos.length}/${MAX_PHOTOS})` : "Add Photos"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => capturePhoto(true)}
              className="flex-1 min-h-[54px] rounded-xl border border-dashed border-[#2A5C43] bg-[#F4FBF7] flex-row items-center justify-center gap-2"
            >
              <MaterialIcons name="photo-camera" size={22} color="#2A5C43" />
              <Text className="text-[#2A5C43] font-black">Camera</Text>
            </Pressable>
          </View>
          {photos.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
              <View className="flex-row gap-2">
                {photos.map((uri, index) => (
                  <View key={`${uri}-${index}`} className="relative">
                    <Image source={{ uri }} style={{ width: 86, height: 86, borderRadius: 12 }} contentFit="cover" />
                    <Pressable
                      onPress={() => setPhotos((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                      className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-red-500 items-center justify-center"
                    >
                      <MaterialIcons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </View>
        
        <Pressable 
          onPress={handleSubmit}
          disabled={loading}
          className={`mt-6 rounded-full min-h-[54px] flex-row items-center justify-center gap-2 ${loading ? "bg-[#6d9a86]" : "bg-[#2A5C43]"}`}
        >
          <MaterialIcons name="add-task" size={20} color="#ffffff" />
          <Text className="text-white font-black text-sm">{loading ? "Saving..." : "Submit Yield Record"}</Text>
        </Pressable>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

function toApiDate(value: string) {
  const [day, month, year] = value.split("/")
  if (!day || !month || !year) return value
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
