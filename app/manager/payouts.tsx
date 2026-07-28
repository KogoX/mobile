import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache, peekCache } from "../../lib/api";
import { useFocusRefresh } from "../../lib/polling";
import { Toast, shortHash } from "../../components/Toast";
import PeriodSelector, { PeriodFilter } from "../../components/PeriodSelector";
import { generateAndSharePDF } from "../../lib/pdfReport";
import { getSessionUser } from "../../lib/session";

type PaymentItem = {
  id: string;
  order_id: string;
  buyer: string;
  quantity: string;
  amount: string;
  status: string;
  created_at: string;
};

type ToastMsg = { text: string; type: "success" | "error" | "info" } | null;

export default function ManagerPayouts() {
  const [payments, setPayments] = useState<PaymentItem[]>(() => peekCache("/payments") || []);
  const [toast, setToast] = useState<ToastMsg>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [managerName, setManagerName] = useState("Manager");

  const [period, setPeriod] = useState<PeriodFilter>({
    preset: "all",
    label: "All Time",
  });

  const loadFromCache = useCallback(() => {
    getSessionUser().then((u) => setManagerName(u?.name || "Manager"));
    AsyncStorage.getItem("manager_payments_cache").then((cached) => {
      if (cached) {
        try {
          if (payments.length === 0) {
            setPayments(JSON.parse(cached));
          }
        } catch {}
      }
    });
  }, [payments.length]);

  useFocusEffect(
    useCallback(() => {
      loadFromCache();
      refresh();
    }, [loadFromCache]),
  );

  function showToast(
    text: string,
    type: "success" | "error" | "info" = "success",
  ) {
    setToast({ text, type });
  }

  const refresh = useCallback(
    async (isManual = false) => {
      if (isManual) {
        setRefreshing(true);
        clearApiCache();
      }
      try {
        let queryUrl = "/payments";
        const params: string[] = [];
        if (period.startDate) params.push(`startDate=${period.startDate}`);
        if (period.endDate) params.push(`endDate=${period.endDate}`);
        if (params.length > 0) queryUrl += `?${params.join("&")}`;

        const { data } = await fetchWithCache(queryUrl, { preferCache: !isManual });
        setPayments(data);
        if (period.preset === "all") {
          AsyncStorage.setItem("manager_payments_cache", JSON.stringify(data)).catch(() => {});
        }
      } catch (error: any) {
        showToast(
          error?.response?.data?.error ||
            error.message ||
            "Failed to load payments",
          "error",
        );
      } finally {
        setRefreshing(false);
      }
    },
    [period],
  );

  useFocusRefresh(refresh);

  const handleExportPDF = async () => {
    if (payments.length === 0 || exporting) return;
    setExporting(true);
    try {
      await generateAndSharePDF({
        title: "Manager Settlements & Payments Report",
        reportType: "payouts",
        userName: managerName,
        periodLabel: period.label,
        items: payments.map((p) => ({
          ...p,
          farmer: p.buyer || "Buyer Order",
          method: "Paystack / Mobile",
        })),
      });
    } catch (e) {
      console.warn("PDF generation error:", e);
    } finally {
      setExporting(false);
    }
  };

  const totals = useMemo(() => {
    const verified = payments.filter((item) => item.status === "Verified");
    const pending = payments.filter((item) => item.status === "Pending");
    const held = payments.filter((item) => item.status === "Held");
    return {
      verifiedAmount: verified.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ),
      pendingAmount: pending.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ),
      heldAmount: held.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      verifiedCount: verified.length,
    };
  }, [payments]);

  async function updatePayment(id: string, status: string) {
    setUpdatingId(id);
    try {
      await api.patch(`/payments/${id}/status`, { status });
      await refresh();
      const label =
        status === "Verified"
          ? "Payment verified"
          : status === "Held"
            ? "Payment held"
            : status === "Rejected"
              ? "Payment rejected"
              : `Payment ${status.toLowerCase()}`;
      showToast(
        label,
        status === "Rejected" || status === "Held" ? "info" : "success",
      );
    } catch (error: any) {
      showToast(
        error?.response?.data?.error ||
          error.message ||
          "Unable to update payment",
        "error",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <Toast message={toast} onDone={() => setToast(null)} />
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(true)}
            colors={["#2A5C43"]}
            tintColor="#2A5C43"
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-3xl font-black text-[#2A5C43]">
              Payments Dashboard
            </Text>
            <Text className="text-gray-500 mt-1 mb-3">
              Confirm buyer payments and release settlement flow.
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleExportPDF}
            disabled={payments.length === 0 || exporting}
            style={{ backgroundColor: payments.length > 0 ? "#2A5C43" : "#9CA3AF" }}
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
            refresh();
          }}
          accentColor="#2A5C43"
        />

        <View className="flex-row flex-wrap gap-3 mb-4">
          <Metric
            label="Disbursed"
            value={`KES ${totals.verifiedAmount.toLocaleString()}`}
            icon="verified"
          />
          <Metric
            label="Pending"
            value={`KES ${totals.pendingAmount.toLocaleString()}`}
            icon="pending-actions"
          />
          <Metric
            label="Held"
            value={`KES ${totals.heldAmount.toLocaleString()}`}
            icon="front-hand"
          />
        </View>

        <View className="bg-[#125C3F] rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-black">
            Settlement Status
          </Text>
          <Text className="text-[#D7F3E5] mt-2">
            {totals.verifiedCount} payments verified. Verified payments
            automatically mark their orders as paid.
          </Text>
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-2">
          Recent Transactions ({period.label})
        </Text>
        {payments.length === 0 ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="font-black text-[#2A5C43]">No payments found</Text>
            <Text className="text-gray-500 mt-1">
              No payments match period: {period.label}.
            </Text>
          </View>
        ) : (
          payments.map((row) => (
            <View
              key={row.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 mb-3"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-black text-[#2A5C43]">
                  Order #{shortHash(row.order_id)}
                </Text>
                <View className="bg-[#E7F5EE] rounded-full px-3 py-1">
                  <Text className="text-[#2A5C43] text-xs font-black">
                    {row.status}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-500 text-xs mt-1">
                Buyer: {row.buyer || "Anonymous Buyer"}
              </Text>
              <Text className="text-gray-500 text-xs">
                {new Date(row.created_at).toLocaleString()}
              </Text>

              <Text className="text-gray-900 font-black text-xl mt-3">
                KES {Number(row.amount).toLocaleString()}
              </Text>

              {row.status === "Pending" ? (
                <View className="flex-row gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Pressable
                    disabled={updatingId === String(row.id)}
                    onPress={() => updatePayment(String(row.id), "Verified")}
                    className="flex-1 bg-[#2A5C43] py-2.5 rounded-xl items-center flex-row justify-center"
                  >
                    {updatingId === String(row.id) ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-black text-xs">Verify</Text>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={updatingId === String(row.id)}
                    onPress={() => updatePayment(String(row.id), "Held")}
                    className="flex-1 bg-[#F59E0B] py-2.5 rounded-xl items-center justify-center"
                  >
                    <Text className="text-white font-black text-xs">Hold</Text>
                  </Pressable>
                  <Pressable
                    disabled={updatingId === String(row.id)}
                    onPress={() => updatePayment(String(row.id), "Rejected")}
                    className="flex-1 bg-[#EF4444] py-2.5 rounded-xl items-center justify-center"
                  >
                    <Text className="text-white font-black text-xs">Reject</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View className="bg-white p-3.5 rounded-2xl border border-gray-200 flex-1 min-w-[100px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-gray-500 text-xs font-bold">{label}</Text>
        <MaterialIcons name={icon} size={16} color="#2A5C43" />
      </View>
      <Text className="text-base font-black text-[#2A5C43] mt-1">{value}</Text>
    </View>
  );
}
