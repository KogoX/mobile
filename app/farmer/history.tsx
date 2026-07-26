import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { useFocusRefresh } from "../../lib/polling";
import { shortHash } from "../../components/Toast";

type YieldItem = {
  id: string;
  crop_season: string;
  variety: string;
  quantity: string;
  grade: string;
  status: string;
  created_at: string;
};

export default function FarmerHistory() {
  const [yields, setYields] = useState<YieldItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFromCache = useCallback(() => {
    AsyncStorage.getItem("farmer_yields_cache").then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setYields(parsed);
          setIsLoading(false);
        } catch {}
      }
    });
  }, []);

  // Instant 0ms hydration from local cache on mount and tab focus
  useFocusEffect(
    useCallback(() => {
      loadFromCache();
      refresh();
    }, [loadFromCache]),
  );

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      if (isManual) clearApiCache();
      const { data } = await fetchWithCache("/yields");
      setYields(data);
      AsyncStorage.setItem("farmer_yields_cache", JSON.stringify(data)).catch(
        () => {},
      );
    } catch (err: any) {
      // Silent catch: preserved from local storage cache
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusRefresh(refresh);

  const onRefresh = useCallback(() => {
    refresh(true);
  }, [refresh]);

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <FlatList
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        data={yields}
        keyExtractor={(item) => String(item.id)}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2A5C43"]}
            tintColor="#2A5C43"
          />
        }
        ListHeaderComponent={
          <View>
            <Text className="text-3xl font-black text-[#2A5C43]">
              Upload History
            </Text>
            <Text className="text-gray-500 mt-1 mb-5">
              All your historical harvest records and their status.
            </Text>

            {isLoading && (
              <View className="items-center py-10 bg-white rounded-2xl border border-gray-200">
                <MaterialIcons name="sync" size={48} color="#d1d5db" />
                <Text className="text-gray-400 font-black text-lg mt-4">
                  Loading history...
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-10 bg-white rounded-2xl border border-gray-200">
              <MaterialIcons name="history" size={48} color="#d1d5db" />
              <Text className="text-gray-400 font-black text-lg mt-4">
                No history found
              </Text>
              <Text className="text-gray-400 text-center mt-1">
                You have not uploaded any yields yet.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: entry }) => (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <Text className="font-black text-[#2A5C43]">
                  #{shortHash(entry.id)} • {entry.crop_season}
                </Text>
                <Text className="text-gray-700 mt-1">
                  {entry.variety} - Grade {entry.grade}
                </Text>
              </View>
              <View className="bg-[#E7F5EE] rounded-full px-3 py-1">
                <Text className="text-[#2A5C43] text-[11px] font-black uppercase">
                  {entry.status || "Logged"}
                </Text>
              </View>
            </View>
            <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
              <Text className="text-gray-900 font-black text-base">
                {Number(entry.quantity).toLocaleString()} kg
              </Text>
              <Text className="text-gray-400 text-xs">
                {new Date(entry.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
