import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { usePollingRefresh } from "../../lib/polling";
import { getSessionUser } from "../../lib/session";
import PeriodSelector, { PeriodFilter } from "../../components/PeriodSelector";
import { generateAndSharePDF } from "../../lib/pdfReport";

type YieldItem = {
  id: string | number;
  crop_season: string;
  variety: string;
  quantity: string;
  grade: string;
  created_at: string;
};

type PayoutItem = {
  id: string | number;
  order_id: string | number | null;
  amount: string;
  method: string;
  status: string;
  reference: string;
  notes: string | null;
  created_at: string;
};

type OrderItem = {
  id: string | number;
  produce: string;
  quantity: string;
  total_amount: string;
  status: string;
  created_at: string;
};

type FarmerProfile = {
  name?: string | null;
  unique_id?: string | null;
};

type ActivityItem =
  | { type: "yield"; data: YieldItem; timestamp: number }
  | { type: "payout"; data: PayoutItem; timestamp: number }
  | { type: "order"; data: OrderItem; timestamp: number };

let _inMemoryFarmerYields: YieldItem[] | null = null;
let _inMemoryFarmerPayouts: PayoutItem[] | null = null;
let _inMemoryFarmerOrders: OrderItem[] | null = null;

export default function FarmerDashboard() {
  const [name, setName] = useState("Farmer");
  const [uniqueId, setUniqueId] = useState("");
  const [yields, setYields] = useState<YieldItem[]>(() => _inMemoryFarmerYields || []);
  const [payouts, setPayouts] = useState<PayoutItem[]>(() => _inMemoryFarmerPayouts || []);
  const [orders, setOrders] = useState<OrderItem[]>(() => _inMemoryFarmerOrders || []);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [exportingReport, setExportingReport] = useState(false);
  const [reportType, setReportType] = useState<"comprehensive" | "payouts" | "yields">("comprehensive");
  const [reportPeriod, setReportPeriod] = useState<PeriodFilter>({
    preset: "all",
    label: "All Time",
  });

  const loadFromCache = useCallback(() => {
    if (_inMemoryFarmerYields) setYields(_inMemoryFarmerYields);
    if (_inMemoryFarmerPayouts) setPayouts(_inMemoryFarmerPayouts);
    if (_inMemoryFarmerOrders) setOrders(_inMemoryFarmerOrders);

    getSessionUser().then((user) => {
      if (user) {
        setName(user.name || "Farmer");
        setUniqueId(user.unique_id || "");
      }
    });

    AsyncStorage.multiGet([
      "farmer_yields_cache",
      "farmer_payouts_cache",
      "farmer_orders_cache",
    ]).then((stores) => {
      const yData = stores[0][1];
      const pData = stores[1][1];
      const oData = stores[2][1];
      if (yData)
        try {
          const parsed = JSON.parse(yData);
          _inMemoryFarmerYields = parsed;
          setYields(parsed);
        } catch {}
      if (pData)
        try {
          const parsed = JSON.parse(pData);
          _inMemoryFarmerPayouts = parsed;
          setPayouts(parsed);
        } catch {}
      if (oData)
        try {
          const parsed = JSON.parse(oData);
          _inMemoryFarmerOrders = parsed;
          setOrders(parsed);
        } catch {}
    });
  }, []);

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
      clearApiCache();
    }
    const p1 = fetchWithCache("/auth/me")
      .then((res) => {
        const profile = res.data as FarmerProfile;
        setName(profile.name || "Farmer");
        setUniqueId(profile.unique_id || "");
      })
      .catch(console.error);

    const p2 = fetchWithCache("/yields")
      .then((res) => {
        setYields(res.data);
        AsyncStorage.setItem(
          "farmer_yields_cache",
          JSON.stringify(res.data),
        ).catch(() => {});
      })
      .catch(console.error);

    const p3 = fetchWithCache("/payouts")
      .then((res) => {
        setPayouts(res.data);
        AsyncStorage.setItem(
          "farmer_payouts_cache",
          JSON.stringify(res.data),
        ).catch(() => {});
      })
      .catch(console.error);

    const p4 = fetchWithCache("/orders")
      .then((res) => {
        setOrders(res.data);
        AsyncStorage.setItem(
          "farmer_orders_cache",
          JSON.stringify(res.data),
        ).catch(() => {});
      })
      .catch(console.error);

    return Promise.allSettled([p1, p2, p3, p4]).then(() => {
      setRefreshing(false);
    });
  }, []);

  // Instant 0ms hydration from local storage on mount and tab focus
  useFocusEffect(
    useCallback(() => {
      loadFromCache();
      refresh();
    }, [loadFromCache, refresh]),
  );

  usePollingRefresh(refresh);

  const onRefresh = useCallback(() => {
    refresh(true);
  }, [refresh]);

  const totalYield = useMemo(
    () => yields.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0),
    [yields],
  );
  const totalPaid = useMemo(
    () =>
      payouts
        .filter((item) => item.status === "Paid")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payouts],
  );
  const pendingPayments = useMemo(
    () =>
      payouts
        .filter((item) => item.status !== "Paid")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payouts],
  );
  const marketDemand = useMemo(
    () => orders.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [orders],
  );
  const gradeTotals = useMemo(
    () =>
      yields.reduce<Record<string, number>>((totals, entry) => {
        totals[entry.grade] =
          (totals[entry.grade] || 0) + Number(entry.quantity || 0);
        return totals;
      }, {}),
    [yields],
  );

  const latestYield = yields[0];
  const strongestGrade = Object.entries(gradeTotals).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const recentActivity = useMemo(() => {
    const activity: ActivityItem[] = [
      ...yields.map((y) => ({
        type: "yield" as const,
        data: y,
        timestamp: new Date(y.created_at).getTime(),
      })),
      ...payouts.map((p) => ({
        type: "payout" as const,
        data: p,
        timestamp: new Date(p.created_at).getTime(),
      })),
      ...orders.map((o) => ({
        type: "order" as const,
        data: o,
        timestamp: new Date(o.created_at).getTime(),
      })),
    ];
    return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  }, [yields, payouts, orders]);

  const handleExportPDF = async () => {
    if (exportingReport) return;
    setExportingReport(true);
    try {
      let filteredYields = yields;
      let filteredPayouts = payouts;

      if (reportPeriod.startDate) {
        const params: string[] = [];
        if (reportPeriod.startDate) params.push(`startDate=${reportPeriod.startDate}`);
        if (reportPeriod.endDate) params.push(`endDate=${reportPeriod.endDate}`);
        const q = params.join("&");
        try {
          const [yRes, pRes] = await Promise.all([
            fetchWithCache(`/yields?${q}`),
            fetchWithCache(`/payouts?${q}`),
          ]);
          if (yRes.data) filteredYields = yRes.data;
          if (pRes.data) filteredPayouts = pRes.data;
        } catch {
          const start = new Date(reportPeriod.startDate + "T00:00:00").getTime();
          const end = new Date((reportPeriod.endDate || reportPeriod.startDate) + "T23:59:59").getTime();
          filteredYields = yields.filter((item) => {
            const t = new Date(item.created_at).getTime();
            return t >= start && t <= end;
          });
          filteredPayouts = payouts.filter((item) => {
            const t = new Date(item.created_at).getTime();
            return t >= start && t <= end;
          });
        }
      }

      if (reportType === "comprehensive") {
        await generateAndSharePDF({
          title: "Comprehensive Farmer Statement",
          reportType: "farmer_comprehensive",
          userName: name,
          userUniqueId: uniqueId,
          periodLabel: reportPeriod.label,
          yieldsItems: filteredYields,
          payoutsItems: filteredPayouts,
        });
      } else if (reportType === "payouts") {
        await generateAndSharePDF({
          title: "Payout Statement",
          reportType: "payouts",
          userName: name,
          userUniqueId: uniqueId,
          periodLabel: reportPeriod.label,
          items: filteredPayouts,
        });
      } else {
        await generateAndSharePDF({
          title: "Harvest Uploads Report",
          reportType: "yields",
          userName: name,
          userUniqueId: uniqueId,
          periodLabel: reportPeriod.label,
          items: filteredYields,
        });
      }
    } catch (e) {
      console.warn("Farmer PDF export error:", e);
    } finally {
      setExportingReport(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2A5C43"]}
            tintColor="#2A5C43"
          />
        }
      >
        <Text className="text-3xl font-black text-[#2A5C43]">
          Welcome, {name}
        </Text>
        {uniqueId ? (
          <Text className="text-gray-500 font-bold mt-1">
            Farmer Code: {uniqueId}
          </Text>
        ) : null}
        <Text className="text-gray-500 mt-1 mb-5">
          Your farm activity, payouts and market demand from live records.
        </Text>
        {loadError ? (
          <View className="bg-amber-50 rounded-xl border border-amber-200 px-4 py-3 mb-4">
            <Text className="text-amber-800 font-bold text-sm">
              {loadError}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-3 mb-3">
          <SummaryCard
            icon="eco"
            label="Total Yield"
            value={`${totalYield.toLocaleString()} kg`}
          />
          <SummaryCard
            icon="verified"
            label="Paid Out"
            value={`KES ${totalPaid.toLocaleString()}`}
          />
        </View>
        <View className="flex-row gap-3 mb-4">
          <SummaryCard
            icon="hourglass-top"
            label="Pending"
            value={`KES ${pendingPayments.toLocaleString()}`}
          />
          <SummaryCard
            icon="shopping-cart"
            label="Demand"
            value={`${marketDemand.toLocaleString()} kg`}
          />
        </View>

        <View className="bg-[#125C3F] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-lg font-black">
              Harvest Snapshot
            </Text>
            <MaterialIcons name="insights" size={22} color="#D7F3E5" />
          </View>
          <Text className="text-[#D7F3E5] mt-2">
            {latestYield
              ? `Latest: ${Number(latestYield.quantity).toLocaleString()} kg of ${latestYield.variety}, Grade ${latestYield.grade}.`
              : "Log your first harvest to start tracking performance."}
          </Text>
          <View className="flex-row gap-2 mt-4">
            {["A", "B", "C"].map((grade) => (
              <View key={grade} className="flex-1 bg-white/10 rounded-xl p-3">
                <Text className="text-[#D7F3E5] text-[10px] font-black uppercase">
                  Grade {grade}
                </Text>
                <Text className="text-white font-black mt-1">
                  {(gradeTotals[grade] || 0).toLocaleString()} kg
                </Text>
              </View>
            ))}
          </View>
          {strongestGrade ? (
            <Text className="text-white mt-3 font-bold">
              Top grade: {strongestGrade[0]} with{" "}
              {strongestGrade[1].toLocaleString()} kg
            </Text>
          ) : null}
        </View>

        {/* PDF Reports Hub */}
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-[#E7F5EE] items-center justify-center mr-2.5">
                <MaterialIcons name="picture-as-pdf" size={18} color="#2A5C43" />
              </View>
              <View>
                <Text className="text-base font-black text-[#2A5C43]">
                  Print PDF & Reports
                </Text>
                <Text className="text-gray-500 text-xs">
                  Export statements for custom periods
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-xs font-bold text-gray-700 mt-2 mb-2">
            Select Report Type:
          </Text>
          <View className="flex-row gap-2 mb-3">
            {[
              { id: "comprehensive", label: "Comprehensive" },
              { id: "payouts", label: "Payments" },
              { id: "yields", label: "Harvest Logs" },
            ].map((tab) => {
              const active = reportType === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setReportType(tab.id as any)}
                  style={{
                    backgroundColor: active ? "#2A5C43" : "#F3F4F6",
                    borderColor: active ? "#2A5C43" : "#E5E7EB",
                  }}
                  className="flex-1 py-2 px-2 rounded-xl border items-center justify-center"
                >
                  <Text
                    style={{ color: active ? "#FFFFFF" : "#4B5563" }}
                    className="text-xs font-bold text-center"
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-xs font-bold text-gray-700 mb-1">
            Filter Period:
          </Text>
          <PeriodSelector
            selectedPeriod={reportPeriod}
            onPeriodChange={setReportPeriod}
            accentColor="#2A5C43"
          />

          <TouchableOpacity
            onPress={handleExportPDF}
            disabled={exportingReport}
            style={{ backgroundColor: "#2A5C43" }}
            className="w-full py-3 rounded-xl flex-row items-center justify-center shadow-xs mt-1"
          >
            <MaterialIcons name="print" size={18} color="#FFFFFF" />
            <Text className="text-white font-black text-sm ml-2">
              {exportingReport ? "Generating PDF..." : "Export / Print PDF"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-3">
          Recent Activity
        </Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((item, idx) => {
            const isLast = idx === recentActivity.length - 1;
            if (item.type === "yield") {
              const y = item.data;
              return (
                <ActivityRow
                  key={`y-${y.id}`}
                  icon="add-chart"
                  color="#2A5C43"
                  bg="#E7F5EE"
                  title={`Logged ${Number(y.quantity).toLocaleString()} kg of ${y.variety}`}
                  subtitle={`Grade ${y.grade} • Season: ${y.crop_season}`}
                  time={new Date(y.created_at).toLocaleString()}
                  isLast={isLast}
                />
              );
            } else if (item.type === "order") {
              const o = item.data;
              return (
                <ActivityRow
                  key={`o-${o.id}`}
                  icon="shopping-cart"
                  color="#d97706"
                  bg="#fef3c7"
                  title={`Order Assigned: ${Number(o.quantity).toLocaleString()} kg`}
                  subtitle={`Status: ${o.status} • KES ${Number(o.total_amount).toLocaleString()}`}
                  time={new Date(o.created_at).toLocaleString()}
                  isLast={isLast}
                />
              );
            } else {
              const p = item.data;
              return (
                <ActivityRow
                  key={`p-${p.id}`}
                  icon="payments"
                  color="#059669"
                  bg="#d1fae5"
                  title={`Payout ${p.status}: KES ${Number(p.amount).toLocaleString()}`}
                  subtitle={`Method: ${p.method} ${p.order_id ? `• Order #${p.order_id}` : ""}`}
                  time={new Date(p.created_at).toLocaleString()}
                  isLast={isLast}
                />
              );
            }
          })
        ) : (
          <EmptyState
            title="No activity yet"
            message="When you log yields, receive orders, or get payouts, they will appear here."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 min-h-[116px]">
      <MaterialIcons name={icon} size={21} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">
        {label}
      </Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
      <Text className="text-[#2A5C43] font-black">{title}</Text>
      <Text className="text-gray-500 mt-1">{message}</Text>
    </View>
  );
}

function ActivityRow({
  icon,
  color,
  bg,
  title,
  subtitle,
  time,
  isLast,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  time: string;
  isLast?: boolean;
}) {
  return (
    <View className="flex-row">
      <View className="items-center mr-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: bg }}
        >
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        {!isLast && <View className="w-px flex-1 bg-gray-200 my-1" />}
      </View>
      <View className="flex-1 pb-4">
        <Text className="text-gray-900 font-bold text-sm leading-5">
          {title}
        </Text>
        <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
        <Text className="text-gray-400 text-[10px] uppercase font-bold mt-1">
          {time}
        </Text>
      </View>
    </View>
  );
}
