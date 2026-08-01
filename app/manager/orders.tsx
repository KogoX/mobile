import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { usePollingRefresh } from "../../lib/polling";
import { Toast, shortHash } from "../../components/Toast";

type YieldItem = {
  id: string;
  farmer: string;
  farmer_id?: string;
  crop_season: string;
  variety: string;
  quantity: string;
  grade: string;
  status: string;
  photos: string[];
  created_at: string;
};

type OrderItem = {
  id: string;
  buyer: string;
  buyer_id?: string;
  farmer?: string | null;
  farmer_id?: string | null;
  yield_id?: string | null;
  produce: string;
  quantity: string;
  total_amount: string;
  status: string;
  payment_status?: string | null;
  created_at: string;
};

type Mode = "harvests" | "orders";
type ToastMsg = { text: string; type: "success" | "error" | "info" } | null;

// Statuses that are "terminal" — no more actions needed
const YIELD_DONE = ["Approved", "Scheduled", "Exported", "Rejected"];
const ORDER_DONE = ["Scheduled", "Paid", "Fulfilled", "Cancelled"];

export default function ManagerOrders() {
  const [mode, setMode] = useState<Mode>("harvests");
  const [query, setQuery] = useState("");
  const [yields, setYields] = useState<YieldItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [toast, setToast] = useState<ToastMsg>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFromCache = useCallback(() => {
    AsyncStorage.multiGet([
      "manager_yields_cache",
      "manager_orders_cache",
    ]).then((stores) => {
      const yData = stores[0][1];
      const oData = stores[1][1];
      if (yData)
        try {
          setYields(JSON.parse(yData));
          setIsLoading(false);
        } catch {}
      if (oData)
        try {
          setOrders(JSON.parse(oData));
          setIsLoading(false);
        } catch {}
    });
  }, []);

  // Instant 0ms hydration on mount & tab focus
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

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
      clearApiCache();
    }
    try {
      const [yieldRes, orderRes] = await Promise.allSettled([
        fetchWithCache("/yields", {
          preferCache: !isManual,
          onFreshData: (data) => {
            if (Array.isArray(data)) {
              setYields(data);
              AsyncStorage.setItem(
                "manager_yields_cache",
                JSON.stringify(data),
              ).catch(() => {});
            }
          },
        }),
        fetchWithCache("/orders", {
          preferCache: !isManual,
          onFreshData: (data) => {
            if (Array.isArray(data)) {
              setOrders(data);
              AsyncStorage.setItem(
                "manager_orders_cache",
                JSON.stringify(data),
              ).catch(() => {});
            }
          },
        }),
      ]);
      if (yieldRes.status === "fulfilled" && Array.isArray(yieldRes.value.data)) {
        setYields(yieldRes.value.data);
        AsyncStorage.setItem(
          "manager_yields_cache",
          JSON.stringify(yieldRes.value.data),
        ).catch(() => {});
      }
      if (orderRes.status === "fulfilled" && Array.isArray(orderRes.value.data)) {
        setOrders(orderRes.value.data);
        AsyncStorage.setItem(
          "manager_orders_cache",
          JSON.stringify(orderRes.value.data),
        ).catch(() => {});
      }
    } catch (error) {
      console.warn("Failed to load items:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  usePollingRefresh(refresh);

  const filteredYields = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return yields;
    return yields.filter((item) =>
      [
        item.farmer,
        item.crop_season,
        item.variety,
        item.grade,
        item.status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [query, yields]);

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((item) =>
      [
        item.buyer,
        item.farmer,
        item.produce,
        item.status,
        item.payment_status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [orders, query]);

  const stats = useMemo(() => {
    const approvedSupply = yields
      .filter((item) =>
        ["Approved", "Scheduled", "Exported"].includes(item.status),
      )
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const openDemand = orders
      .filter(
        (item) => !["Paid", "Fulfilled", "Cancelled"].includes(item.status),
      )
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const exportGrade = yields.filter((item) => item.grade === "A").length;
    return { approvedSupply, openDemand, exportGrade };
  }, [orders, yields]);

  async function updateYield(id: string, status: string) {
    setUpdatingId(id);
    try {
      await api.patch(`/yields/${id}/status`, { status });
      clearApiCache();
      const updatedList = yields.map((y) =>
        y.id === id ? { ...y, status } : y,
      );
      setYields(updatedList);
      AsyncStorage.setItem(
        "manager_yields_cache",
        JSON.stringify(updatedList),
      ).catch(() => {});

      // Sync approved harvest directly to Buyer Market cache
      if (status === "Approved") {
        AsyncStorage.getItem("buyer_market_cache")
          .then((cached) => {
            const bList = cached ? JSON.parse(cached) : [];
            const targetItem = updatedList.find((y) => y.id === id);
            if (targetItem) {
              const idx = bList.findIndex((item: any) => item.id === id);
              let nextBList;
              if (idx >= 0) {
                nextBList = bList.map((item: any, i: number) =>
                  i === idx ? targetItem : item,
                );
              } else {
                nextBList = [targetItem, ...bList];
              }
              AsyncStorage.setItem(
                "buyer_market_cache",
                JSON.stringify(nextBList),
              ).catch(() => {});
            }
          })
          .catch(() => {});
      }

      const label =
        status === "Approved"
          ? "Approve success"
          : status === "Rejected"
            ? "Harvest rejected"
            : status === "Scheduled"
              ? "Harvest scheduled"
              : `Harvest ${status.toLowerCase()}`;
      showToast(label, status === "Rejected" ? "error" : "success");
    } catch (error: any) {
      showToast(
        error?.response?.data?.error ||
          error.message ||
          "Unable to update harvest",
        "error",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateOrder(id: string, status: string) {
    setUpdatingId(id);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      clearApiCache();
      const updatedList = orders.map((o) =>
        o.id === id ? { ...o, status } : o,
      );
      setOrders(updatedList);
      AsyncStorage.setItem(
        "manager_orders_cache",
        JSON.stringify(updatedList),
      ).catch(() => {});

      // Sync status directly to Buyer Orders cache
      AsyncStorage.getItem("buyer_orders_cache")
        .then((cached) => {
          const bList = cached ? JSON.parse(cached) : [];
          const nextBList = bList.map((item: any) =>
            item.id === id ? { ...item, status } : item,
          );
          AsyncStorage.setItem(
            "buyer_orders_cache",
            JSON.stringify(nextBList),
          ).catch(() => {});
        })
        .catch(() => {});

      const label =
        status === "Approved"
          ? "Order approved"
          : status === "Scheduled"
            ? "Order scheduled"
            : status === "Cancelled"
              ? "Order cancelled"
              : `Order ${status.toLowerCase()}`;
      showToast(label, status === "Cancelled" ? "error" : "success");
    } catch (error: any) {
      showToast(
        error?.response?.data?.error ||
          error.message ||
          "Unable to update order",
        "error",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <Toast message={toast} onDone={() => setToast(null)} />

      <FlatList
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(true)}
            colors={["#2A5C43"]}
            tintColor="#2A5C43"
          />
        }
        data={
          (isLoading
            ? []
            : mode === "harvests"
              ? filteredYields
              : filteredOrders) as any[]
        }
        keyExtractor={(item) => item.id}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        ListHeaderComponent={
          <View>
            <Text className="text-3xl font-black text-[#2A5C43]">
              Harvests & Orders
            </Text>
            <Text className="text-gray-500 mt-1 mb-5">
              Match farmer supply to buyer demand and advance export flow.
            </Text>

            <View className="flex-row gap-3 mb-4">
              <Metric
                label="Approved Supply"
                value={`${stats.approvedSupply.toLocaleString()} kg`}
              />
              <Metric
                label="Open Demand"
                value={`${stats.openDemand.toLocaleString()} kg`}
              />
              <Metric
                label="Grade A Lots"
                value={stats.exportGrade.toLocaleString()}
              />
            </View>

            <View className="flex-row bg-white rounded-2xl border border-gray-200 p-1 mb-4">
              <Segment
                label="Harvests"
                active={mode === "harvests"}
                onPress={() => setMode("harvests")}
              />
              <Segment
                label="Orders"
                active={mode === "orders"}
                onPress={() => setMode("orders")}
              />
            </View>

            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-4">
              <MaterialIcons name="search" size={20} color="#6b7280" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  mode === "harvests"
                    ? "Search harvests, farmers, grades..."
                    : "Search buyers, orders, status..."
                }
                placeholderTextColor="#9ca3af"
                className="flex-1 min-h-[48px] ml-2 text-gray-800"
                style={{ outlineStyle: "none" } as never}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")}>
                  <MaterialIcons name="close" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </View>

            {isLoading && (
              <View>
                {[1, 2, 3].map((key) => (
                  <View
                    key={key}
                    className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 opacity-70"
                  >
                    <View className="flex-row items-start justify-between gap-3 mt-1">
                      <View className="flex-1">
                        <View className="h-6 w-2/3 bg-gray-200 rounded-full mb-2" />
                        <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-1" />
                        <View className="h-4 w-1/3 bg-gray-200 rounded-full" />
                      </View>
                      <View className="h-6 w-20 bg-gray-200 rounded-full" />
                    </View>
                    <View className="h-6 w-1/4 bg-gray-200 rounded-full mt-4" />
                    <View className="flex-row gap-2 mt-4">
                      <View className="flex-1 h-10 bg-gray-200 rounded-xl" />
                      <View className="flex-1 h-10 bg-gray-200 rounded-xl" />
                      <View className="flex-1 h-10 bg-gray-200 rounded-xl" />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            mode === "harvests" ? (
              <EmptyCard
                title="No harvests"
                message="Farmer harvest submissions will appear here."
              />
            ) : (
              <EmptyCard
                title="No orders"
                message="Buyer orders will appear here once created."
              />
            )
          ) : null
        }
        renderItem={({ item: row }: any) => {
          if (mode === "harvests") {
            const isUpdating = updatingId === row.id;
            const status = row.status;
            // Which actions are available for each status
            const canApprove = !["Approved", "Scheduled", "Exported"].includes(
              status,
            );
            const canSchedule = status === "Approved";
            const canReject = !["Rejected", "Scheduled", "Exported"].includes(
              status,
            );

            return (
              <View
                key={row.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 mb-3"
              >
                {/* Status accent bar */}
                <View
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{
                    backgroundColor:
                      status === "Approved"
                        ? "#2A5C43"
                        : status === "Scheduled"
                          ? "#2563EB"
                          : status === "Rejected"
                            ? "#DC2626"
                            : status === "Exported"
                              ? "#7C3AED"
                              : "#D97706",
                  }}
                />

                <View className="flex-row items-start justify-between gap-3 mt-1">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-[#2A5C43]">
                      Harvest #{shortHash(row.id)}
                    </Text>
                    <Text className="text-gray-700 mt-1">
                      <Text className="font-bold">
                        {row.farmer || "Unknown Farmer"}
                      </Text>
                      {" · "}
                      {row.crop_season}
                    </Text>
                    <Text className="text-gray-600">
                      {row.variety} · Grade {row.grade}
                    </Text>
                  </View>
                  <StatusPill status={status} />
                </View>

                <Text className="text-gray-900 font-black mt-3 text-base">
                  {Number(row.quantity).toLocaleString()} kg
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {new Date(row.created_at).toLocaleString()}
                </Text>

                {row.photos?.length ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-3"
                  >
                    <View className="flex-row gap-2">
                      {row.photos.map((uri: string, index: number) => (
                        <Image
                          key={`${row.id}-${index}`}
                          source={{ uri }}
                          style={{ width: 96, height: 96, borderRadius: 12 }}
                          contentFit="cover"
                        />
                      ))}
                    </View>
                  </ScrollView>
                ) : null}

                {/* Status-aware action buttons */}
                {isUpdating ? (
                  <View className="flex-row gap-2 mt-4 items-center justify-center py-2">
                    <ActivityIndicator size="small" color="#2A5C43" />
                    <Text className="text-gray-500 font-bold text-sm">
                      Updating…
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row gap-2 mt-4">
                    <YieldActionBtn
                      label="Approve"
                      active={status === "Approved"}
                      disabled={!canApprove}
                      tone="approve"
                      onPress={() => updateYield(row.id, "Approved")}
                    />
                    <YieldActionBtn
                      label="Schedule"
                      active={status === "Scheduled"}
                      disabled={!canSchedule}
                      tone="schedule"
                      onPress={() => updateYield(row.id, "Scheduled")}
                    />
                    <YieldActionBtn
                      label="Reject"
                      active={status === "Rejected"}
                      disabled={!canReject}
                      tone="reject"
                      onPress={() => updateYield(row.id, "Rejected")}
                    />
                  </View>
                )}

                {/* Terminal status message */}
                {["Scheduled", "Exported"].includes(status) && (
                  <View className="flex-row items-center gap-2 mt-3 bg-blue-50 rounded-xl px-3 py-2">
                    <MaterialIcons
                      name="info-outline"
                      size={14}
                      color="#2563EB"
                    />
                    <Text className="text-blue-700 text-xs font-bold">
                      {status === "Scheduled"
                        ? "Linked to a buyer order — awaiting export"
                        : "Exported — no further action needed"}
                    </Text>
                  </View>
                )}
              </View>
            );
          } else {
            const isUpdating = updatingId === row.id;
            const status = row.status;
            const canApprove = ![
              "Approved",
              "Scheduled",
              "Paid",
              "Fulfilled",
            ].includes(status);
            const canSchedule = status === "Approved";
            const canCancel = !["Cancelled", "Paid", "Fulfilled"].includes(
              status,
            );

            return (
              <View
                key={row.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 mb-3"
              >
                {/* Status accent bar */}
                <View
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{
                    backgroundColor:
                      status === "Approved"
                        ? "#2A5C43"
                        : status === "Scheduled"
                          ? "#2563EB"
                          : status === "Paid" || status === "Fulfilled"
                            ? "#7C3AED"
                            : status === "Cancelled"
                              ? "#DC2626"
                              : "#D97706",
                  }}
                />

                <View className="flex-row items-start justify-between gap-3 mt-1">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-[#2A5C43]">
                      Order #{shortHash(row.id)}
                    </Text>
                    <Text className="text-gray-700 mt-1">
                      <Text className="font-bold">
                        {row.buyer || "Unknown Buyer"}
                      </Text>
                      {" · "}
                      {row.produce}
                    </Text>
                    <Text className="text-gray-600">
                      {Number(row.quantity || 0).toLocaleString()} kg requested
                    </Text>
                    {row.farmer ? (
                      <View className="flex-row items-center gap-1 mt-1">
                        <MaterialIcons name="link" size={13} color="#2A5C43" />
                        <Text className="text-[#2A5C43] text-xs font-bold">
                          {row.farmer} · Harvest #
                          {row.yield_id ? shortHash(row.yield_id) : "—"}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-gray-400 text-xs mt-1">
                        Not yet matched to a farmer harvest
                      </Text>
                    )}
                  </View>
                  <StatusPill status={status} />
                </View>

                <Text className="text-gray-900 font-black mt-3">
                  KES {Number(row.total_amount || 0).toLocaleString()}
                </Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <MaterialIcons
                    name={
                      row.payment_status === "Verified"
                        ? "check-circle"
                        : "radio-button-unchecked"
                    }
                    size={13}
                    color={
                      row.payment_status === "Verified" ? "#2A5C43" : "#9ca3af"
                    }
                  />
                  <Text className="text-gray-500 text-xs">
                    Payment: {row.payment_status || "Not received"}
                  </Text>
                </View>

                {isUpdating ? (
                  <View className="flex-row gap-2 mt-4 items-center justify-center py-2">
                    <ActivityIndicator size="small" color="#2A5C43" />
                    <Text className="text-gray-500 font-bold text-sm">
                      Updating…
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row gap-2 mt-4">
                    <YieldActionBtn
                      label="Approve"
                      active={status === "Approved"}
                      disabled={!canApprove}
                      tone="approve"
                      onPress={() => updateOrder(row.id, "Approved")}
                    />
                    <YieldActionBtn
                      label="Schedule"
                      active={status === "Scheduled"}
                      disabled={!canSchedule}
                      tone="schedule"
                      onPress={() => updateOrder(row.id, "Scheduled")}
                    />
                    <YieldActionBtn
                      label="Cancel"
                      active={status === "Cancelled"}
                      disabled={!canCancel}
                      tone="reject"
                      onPress={() => updateOrder(row.id, "Cancelled")}
                    />
                  </View>
                )}
              </View>
            );
          }
        }}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200">
      <Text className="text-[10px] text-gray-500 uppercase font-black">
        {label}
      </Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-xl py-3 items-center ${active ? "bg-[#2A5C43]" : ""}`}
    >
      <Text className={`font-black ${active ? "text-white" : "text-gray-600"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: string }) {
  const bad = ["Rejected", "Cancelled"].includes(status);
  const done = [
    "Approved",
    "Scheduled",
    "Paid",
    "Fulfilled",
    "Exported",
  ].includes(status);
  return (
    <View
      className={`rounded-full px-3 py-1 ${bad ? "bg-red-100" : done ? "bg-[#E7F5EE]" : "bg-amber-100"}`}
    >
      <Text
        className={`text-[11px] font-black uppercase ${bad ? "text-red-700" : done ? "text-[#2A5C43]" : "text-amber-700"}`}
      >
        {status}
      </Text>
    </View>
  );
}

/**
 * Status-aware action button.
 * - active: currently the item's status → solid filled highlight
 * - disabled: not applicable for this status → greyed out, non-pressable
 * - normal: available action
 */
function YieldActionBtn({
  label,
  tone,
  active,
  disabled,
  onPress,
}: {
  label: string;
  tone: "approve" | "schedule" | "reject";
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  if (active) {
    // Currently selected status — highlighted, no press needed
    const activeColors = {
      approve: { bg: "#2A5C43", text: "#fff", icon: "check-circle" as const },
      schedule: { bg: "#2563EB", text: "#fff", icon: "schedule" as const },
      reject: { bg: "#DC2626", text: "#fff", icon: "cancel" as const },
    };
    const c = activeColors[tone];
    return (
      <View
        style={{
          backgroundColor: c.bg,
          flex: 1,
          borderRadius: 12,
          paddingVertical: 10,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <MaterialIcons name={c.icon} size={14} color={c.text} />
        <Text style={{ color: c.text, fontWeight: "800", fontSize: 13 }}>
          {label}
        </Text>
      </View>
    );
  }

  if (disabled) {
    // Not applicable — dimmed
    return (
      <View
        style={{
          flex: 1,
          borderRadius: 12,
          paddingVertical: 10,
          alignItems: "center",
          backgroundColor: "#F3F4F6",
          opacity: 0.45,
        }}
      >
        <Text style={{ color: "#9CA3AF", fontWeight: "800", fontSize: 13 }}>
          {label}
        </Text>
      </View>
    );
  }

  // Normal available action
  const normalColors = {
    approve: { bg: "#2A5C43", text: "#fff" },
    schedule: { bg: "#EFF6FF", text: "#2563EB" },
    reject: { bg: "#FFF", text: "#DC2626", border: "#FCA5A5" },
  };
  const c = normalColors[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: pressed ? "#e5e7eb" : c.bg,
        borderWidth: tone === "reject" ? 1 : 0,
        borderColor: tone === "reject" ? "#FCA5A5" : "transparent",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: c.text, fontWeight: "800", fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <View className="bg-white rounded-2xl p-6 border border-gray-200 items-center">
      <MaterialIcons name="inbox" size={40} color="#d1d5db" />
      <Text className="font-black text-gray-400 mt-3">{title}</Text>
      <Text className="text-gray-400 text-sm mt-1 text-center">{message}</Text>
    </View>
  );
}

function Action({
  label,
  onPress,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "neutral" | "danger";
}) {
  const classes =
    tone === "primary"
      ? "bg-[#2A5C43]"
      : tone === "danger"
        ? "bg-white border border-red-300"
        : "bg-white border border-gray-200";
  const text =
    tone === "primary"
      ? "text-white"
      : tone === "danger"
        ? "text-red-600"
        : "text-gray-700";
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-xl py-3 items-center ${classes}`}
    >
      <Text className={`font-black ${text}`}>{label}</Text>
    </Pressable>
  );
}
