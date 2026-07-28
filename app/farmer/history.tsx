import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache, peekCache } from "../../lib/api";
import { useFocusRefresh } from "../../lib/polling";
import { getSessionUser } from "../../lib/session";
import { shortHash } from "../../components/Toast";
import PeriodSelector, { PeriodFilter } from "../../components/PeriodSelector";
import { generateAndSharePDF } from "../../lib/pdfReport";

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
  const [yields, setYields] = useState<YieldItem[]>(() => peekCache("/yields") || []);
  const [isLoading, setIsLoading] = useState(yields.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [userName, setUserName] = useState("Farmer");
  const [userUniqueId, setUserUniqueId] = useState("");

  const [period, setPeriod] = useState<PeriodFilter>({
    preset: "all",
    label: "All Time",
  });

  const loadUser = useCallback(() => {
    getSessionUser().then((u) => {
      if (u) {
        setUserName(u.name || "Farmer");
        setUserUniqueId(u.unique_id || "");
      }
    });
  }, []);

  const loadFromCache = useCallback(() => {
    AsyncStorage.getItem("farmer_yields_cache").then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (yields.length === 0) {
            setYields(parsed);
            setIsLoading(false);
          }
        } catch {}
      }
    });
  }, [yields.length]);

  const refresh = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        if (isManual) clearApiCache();

        let queryUrl = "/yields";
        const params: string[] = [];
        if (period.startDate) params.push(`startDate=${period.startDate}`);
        if (period.endDate) params.push(`endDate=${period.endDate}`);
        if (params.length > 0) queryUrl += `?${params.join("&")}`;

        const { data } = await fetchWithCache(queryUrl, { preferCache: !isManual });
        setYields(data);
        if (period.preset === "all") {
          AsyncStorage.setItem("farmer_yields_cache", JSON.stringify(data)).catch(() => {});
        }
      } catch (err: any) {
        // Silent catch: preserved from local storage cache
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  );

  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadFromCache();
      refresh();
    }, [loadUser, loadFromCache, refresh]),
  );

  useFocusRefresh(refresh);

  const onRefresh = useCallback(() => {
    refresh(true);
  }, [refresh]);

  const handleExportPDF = async () => {
    if (yields.length === 0 || exporting) return;
    setExporting(true);
    try {
      await generateAndSharePDF({
        title: "Harvest Uploads Report",
        reportType: "yields",
        userName,
        userUniqueId,
        periodLabel: period.label,
        items: yields,
      });
    } catch (e) {
      console.warn("PDF generation error:", e);
    } finally {
      setExporting(false);
    }
  };

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
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-3xl font-black text-[#2A5C43]">
                  Upload History
                </Text>
                <Text className="text-gray-500 mt-0.5 mb-3">
                  Harvest records and delivery status.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleExportPDF}
                disabled={yields.length === 0 || exporting}
                style={{ backgroundColor: yields.length > 0 ? "#2A5C43" : "#9CA3AF" }}
                className="px-3.5 py-2.5 rounded-xl flex-row items-center shadow-sm"
              >
                <MaterialIcons name="picture-as-pdf" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-xs ml-1.5">
                  {exporting ? "PDF..." : "PDF Report"}
                </Text>
              </TouchableOpacity>
            </View>

            <PeriodSelector
              selectedPeriod={period}
              onPeriodChange={(newPeriod) => {
                setPeriod(newPeriod);
                setIsLoading(true);
              }}
              accentColor="#2A5C43"
            />

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
                No yield uploads found for the period: {period.label}.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: entry }) => (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3 shadow-xs">
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
