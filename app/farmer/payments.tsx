import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache, peekCache } from "../../lib/api";
import { useFocusRefresh } from "../../lib/polling";
import { getSessionUser } from "../../lib/session";
import { shortHash } from "../../components/Toast";
import PeriodSelector, { PeriodFilter } from "../../components/PeriodSelector";
import { generateAndSharePDF } from "../../lib/pdfReport";

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
  const [payouts, setPayouts] = useState<Payout[]>(() => peekCache("/payouts") || []);
  const [isLoading, setIsLoading] = useState(payouts.length === 0);
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
    AsyncStorage.getItem("farmer_payouts_cache").then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (payouts.length === 0) {
            setPayouts(parsed);
            setIsLoading(false);
          }
        } catch {}
      }
    });
  }, [payouts.length]);

  const refresh = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        if (isManual) clearApiCache();

        let queryUrl = "/payouts";
        const params: string[] = [];
        if (period.startDate) params.push(`startDate=${period.startDate}`);
        if (period.endDate) params.push(`endDate=${period.endDate}`);
        if (params.length > 0) queryUrl += `?${params.join("&")}`;

        const { data } = await fetchWithCache(queryUrl, { preferCache: !isManual });
        setPayouts(data);
        if (period.preset === "all") {
          AsyncStorage.setItem("farmer_payouts_cache", JSON.stringify(data)).catch(() => {});
        }
      } catch (err) {
        console.log("Failed to refresh payouts:", err);
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
    if (payouts.length === 0 || exporting) return;
    setExporting(true);
    try {
      await generateAndSharePDF({
        title: "Payout Statement",
        reportType: "payouts",
        userName,
        userUniqueId,
        periodLabel: period.label,
        items: payouts,
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
        data={payouts}
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
                <Text className="text-3xl font-black text-[#2A5C43]">Payouts</Text>
                <Text className="text-gray-500 mt-0.5 mb-3">
                  Settlements and disbursements.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleExportPDF}
                disabled={payouts.length === 0 || exporting}
                style={{ backgroundColor: payouts.length > 0 ? "#2A5C43" : "#9CA3AF" }}
                className="px-3.5 py-2.5 rounded-xl flex-row items-center shadow-sm"
              >
                <MaterialIcons name="picture-as-pdf" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-xs ml-1.5">
                  {exporting ? "PDF..." : "Statement"}
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
                  Loading payouts...
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-10 bg-white rounded-2xl border border-gray-200">
              <MaterialIcons name="account-balance-wallet" size={48} color="#d1d5db" />
              <Text className="text-gray-400 font-black text-lg mt-4">
                No payouts found
              </Text>
              <Text className="text-gray-400 text-center mt-1">
                No disbursements recorded for period: {period.label}.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3 shadow-xs">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <Text className="font-black text-[#2A5C43]">
                  {item.reference || `#${shortHash(item.id)}`}
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5">
                  Via {item.method?.toUpperCase()}
                </Text>
              </View>
              <View className="bg-[#E7F5EE] rounded-full px-3 py-1">
                <Text className="text-[#2A5C43] text-[11px] font-black uppercase">
                  {item.status}
                </Text>
              </View>
            </View>

            {item.notes ? (
              <Text className="text-gray-600 text-xs mt-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                {item.notes}
              </Text>
            ) : null}

            <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
              <Text className="text-gray-900 font-black text-lg">
                KES {Number(item.amount).toLocaleString()}
              </Text>
              <Text className="text-gray-400 text-xs">
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
