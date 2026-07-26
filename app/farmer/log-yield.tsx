import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache } from "../../lib/api";

import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_PHOTOS = 10;
const MAX_BATCH_BYTES = 8 * 1024 * 1024; // 8MB Limit per yield log

export default function LogYield() {
  const [season, setSeason] = useState("Main Season 2026");
  const [quantity, setQuantity] = useState("");
  const [grade, setGrade] = useState("A");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${today.getFullYear()}`;
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function compressImage(uri: string): Promise<string> {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.5, format: SaveFormat.JPEG, base64: true }
      );
      if (result.base64) {
        return `data:image/jpeg;base64,${result.base64}`;
      }
      return uri;
    } catch {
      return uri;
    }
  }

  async function capturePhoto(useCamera: boolean) {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Photo limit reached",
        `You can upload up to ${MAX_PHOTOS} photos per yield.`,
      );
      return;
    }

    let permission;
    if (useCamera) {
      permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Allow camera access to capture harvest photos.",
        );
        return;
      }
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Allow photo access to attach harvest photos.",
        );
        return;
      }
    }

    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        cameraType: ImagePicker.CameraType.back,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        selectionLimit: MAX_PHOTOS - photos.length,
      });
    }

    if (result.canceled) return;

    setCompressing(true);
    try {
      const compressedBatch: string[] = [];
      for (const asset of result.assets.slice(0, MAX_PHOTOS - photos.length)) {
        const compressedData = await compressImage(asset.uri);
        compressedBatch.push(compressedData);
      }

      const nextPhotos = [...photos, ...compressedBatch].slice(0, MAX_PHOTOS);
      const totalSize = nextPhotos.reduce((acc, p) => acc + p.length, 0);

      if (totalSize > MAX_BATCH_BYTES) {
        Alert.alert(
          "Batch size limit",
          "Total photos exceed 8MB limit. Some photos were omitted to stay under 8MB.",
        );
        let trimmed: string[] = [];
        let currentBytes = 0;
        for (const p of nextPhotos) {
          if (currentBytes + p.length <= MAX_BATCH_BYTES) {
            trimmed.push(p);
            currentBytes += p.length;
          }
        }
        setPhotos(trimmed);
      } else {
        setPhotos(nextPhotos);
      }
    } finally {
      setCompressing(false);
    }
  }

  const handleSubmit = async () => {
    if (!quantity) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid harvest quantity in kilograms.",
      });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await api.post("/yields", {
        cropSeason: season,
        quantity: Number(quantity),
        grade,
        date: toApiDate(date),
        photos,
      });
      clearApiCache();

      // Prepend created yield to local storage caches so Farmer and Manager update instantly (0ms)
      try {
        const cached = await AsyncStorage.getItem("farmer_yields_cache");
        const list = cached ? JSON.parse(cached) : [];
        await AsyncStorage.setItem(
          "farmer_yields_cache",
          JSON.stringify([res.data, ...list]),
        );

        const mCached = await AsyncStorage.getItem("manager_yields_cache");
        if (mCached) {
          const mList = JSON.parse(mCached);
          await AsyncStorage.setItem(
            "manager_yields_cache",
            JSON.stringify([res.data, ...mList]),
          );
        }
      } catch (e) {}

      setStatusMessage({
        type: "success",
        text: `Logged ${quantity} kg (Grade ${grade}) successfully! Your dashboard and history have been updated.`,
      });
      setQuantity("");
      setPhotos([]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit harvest record.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 bg-[#FCF9F8] p-5">
        <View className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <Text className="text-[#2A5C43] text-2xl font-black mb-2">
            Log New Harvest
          </Text>

          {statusMessage ? (
            <View
              className={`rounded-2xl p-4 mb-4 flex-row items-center gap-3 border ${
                statusMessage.type === "success"
                  ? "bg-[#E7F5EE] border-[#2A5C43]"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <MaterialIcons
                name={
                  statusMessage.type === "success"
                    ? "check-circle"
                    : "error-outline"
                }
                size={24}
                color={statusMessage.type === "success" ? "#2A5C43" : "#dc2626"}
              />
              <View className="flex-1">
                <Text
                  className={`font-black text-sm ${
                    statusMessage.type === "success"
                      ? "text-[#2A5C43]"
                      : "text-red-800"
                  }`}
                >
                  {statusMessage.type === "success"
                    ? "Harvest Logged!"
                    : "Submission Failed"}
                </Text>
                <Text
                  className={`text-xs mt-0.5 ${
                    statusMessage.type === "success"
                      ? "text-[#1e4431]"
                      : "text-red-700"
                  }`}
                >
                  {statusMessage.text}
                </Text>
              </View>
              {statusMessage.type === "error" ? (
                <Pressable
                  onPress={handleSubmit}
                  className="bg-red-600 rounded-xl px-3 py-2"
                >
                  <Text className="text-white font-black text-xs">
                    Try Again
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View className="mt-4">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
              Crop Season
            </Text>
            <TextInput
              className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 text-gray-800 font-bold"
              value={season}
              onChangeText={setSeason}
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
              Quantity (Kilograms)
            </Text>
            <TextInput
              className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 text-gray-800 font-bold"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>

          <View className="mt-4 mb-2">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
              Produce Grade
            </Text>
            <View className="flex-row gap-3">
              {["A", "B", "C"].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGrade(g)}
                  className={`flex-1 border rounded-xl py-3 items-center ${
                    grade === g
                      ? "bg-[#2A5C43] border-[#2A5C43]"
                      : "bg-[#F9F9F9] border-gray-200"
                  }`}
                >
                  <Text
                    className={`font-black ${grade === g ? "text-white" : "text-gray-500"}`}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
              Harvest Date
            </Text>

            {/* Date Helper Quick-Pick Chips */}
            <View className="flex-row flex-wrap gap-1.5 mb-2">
              {[
                { label: "Today", days: 0 },
                { label: "Yesterday", days: -1 },
                { label: "2 Days Ago", days: -2 },
                { label: "3 Days Ago", days: -3 },
              ].map((chip) => {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + chip.days);
                const day = String(targetDate.getDate()).padStart(2, "0");
                const month = String(targetDate.getMonth() + 1).padStart(2, "0");
                const formatted = `${day}/${month}/${targetDate.getFullYear()}`;
                const isSelected = date === formatted;
                return (
                  <Pressable
                    key={chip.label}
                    onPress={() => setDate(formatted)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      isSelected
                        ? "bg-[#2A5C43] border-[#2A5C43]"
                        : "bg-gray-100 border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              className="min-h-[48px] bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 text-gray-800 font-bold"
              value={date}
              onChangeText={setDate}
              placeholder="DD/MM/YYYY"
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 ml-1">
              Upload Sample & Farm State
            </Text>
            <Text className="text-gray-400 text-[10px] font-bold mb-3 ml-1 leading-tight">
              Add pictures of the harvest sample and farm condition to help the
              manager plan pickup & delivery.
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => capturePhoto(false)}
                className="flex-1 min-h-[54px] rounded-xl border border-dashed border-[#2A5C43] bg-[#F4FBF7] flex-row items-center justify-center gap-2"
              >
                <MaterialIcons
                  name="add-photo-alternate"
                  size={22}
                  color="#2A5C43"
                />
                <Text className="text-[#2A5C43] font-black">
                  {photos.length
                    ? `Library (${photos.length}/${MAX_PHOTOS})`
                    : "Add Photos"}
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
              >
                <View className="flex-row gap-2">
                  {photos.map((uri, index) => (
                    <View key={`${uri}-${index}`} className="relative">
                      <Image
                        source={{ uri }}
                        style={{ width: 86, height: 86, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={() =>
                          setPhotos((items) =>
                            items.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
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
            <Text className="text-white font-black text-sm">
              {loading ? "Saving..." : "Submit Yield Record"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function toApiDate(value: string) {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return value;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
