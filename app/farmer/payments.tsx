import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusRefresh } from "../../lib/polling";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { shortHash } from "../../components/Toast";

type Payout = {
  id: number;
  order_id: number | null;
  amount: string;
  method: string;
  status: string;
  reference: string;
  notes: string | null;
  created_at: string;
};

export default function FarmerPayments() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Instant 0ms hydration from local storage
  useEffect(() => {
    AsyncStorage.getItem("farmer_payouts_cache").then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPayouts(parsed);
          setIsLoading(false);
        } catch {}
      }
    });
    refresh();
  }, []);

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      if (isManual) clearApiCache();
      const { data } = await fetchWithCache("/payouts");
      setPayouts(data);
      AsyncStorage.setItem("farmer_payouts_cache", JSON.stringify(data)).catch(
        () => {},
      );
    } catch (err) {
      console.log("Failed to refresh payouts:", err);
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
        data={isLoading ? [] : payouts}
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
            <Text className="text-3xl font-black text-[#2A5C43]">Payouts</Text>
            <Text className="text-gray-500 mt-1 mb-5">
              Your settlements and disbursements.
            </Text>

            {isLoading && (
              <View>
                {[1, 2, 3].map((key) => (
                  <View
                    key={key}
                    className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 opacity-70"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="h-6 w-1/3 bg-gray-200 rounded-full" />
                      <View className="h-6 w-20 bg-gray-200 rounded-full" />
                    </View>
                    <View className="h-4 w-1/2 bg-gray-200 rounded-full mt-3" />
                    <View className="h-6 w-1/4 bg-gray-200 rounded-full mt-3" />
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="bg-white rounded-2xl p-6 border border-gray-200 items-center">
              <Text className="text-[#2A5C43] font-black text-lg">
                No payouts yet
              </Text>
              <Text className="text-gray-500 mt-1 text-center">
                Your disbursements will appear here once processed by your
                cooperative manager.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-black text-[#2A5C43]">
                Payout #{item.id}
              </Text>
              <View
                className={`rounded-full px-3 py-1 ${item.status === "Paid" ? "bg-[#E7F5EE]" : item.status === "Processing" ? "bg-amber-100" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-[11px] font-black uppercase ${item.status === "Paid" ? "text-[#2A5C43]" : item.status === "Processing" ? "text-amber-700" : "text-gray-600"}`}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <Text className="text-gray-700 mt-1">
              Method: {item.method.toUpperCase()}
            </Text>
            {item.order_id && (
              <Text className="text-gray-700">Order: #{item.order_id}</Text>
            )}
            <Text className="text-gray-900 font-black mt-2 text-base">
              KES {Number(item.amount).toLocaleString()}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Ref: {shortHash(item.reference)} •{" "}
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
