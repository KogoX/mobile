import { useFocusRefresh } from "../../lib/polling";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { shortHash } from "../../components/Toast";

type Order = {
  id: number;
  quantity: string;
  produce: string;
  unit_price: string;
  total_amount: string;
  status: string;
  payment_status: string | null;
  created_at: string;
};

let _inMemoryInvoiceCache: Order[] | null = null;

export default function BuyerInvoices() {
  const [orders, setOrders] = useState<Order[]>(() => _inMemoryInvoiceCache || []);
  const [isLoading, setIsLoading] = useState(() => !_inMemoryInvoiceCache);
  const [refreshing, setRefreshing] = useState(false);

  const loadFromCache = useCallback(() => {
    if (_inMemoryInvoiceCache) {
      setOrders(_inMemoryInvoiceCache);
      setIsLoading(false);
    }
    AsyncStorage.getItem("buyer_orders_cache").then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          _inMemoryInvoiceCache = parsed;
          setOrders(parsed);
          setIsLoading(false);
        } catch {}
      }
    });
  }, []);

  // Instant 0ms hydration on mount & tab focus
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
      const res = await api.get("/orders");
      const data = res.data;
      if (Array.isArray(data)) {
        _inMemoryInvoiceCache = data;
        setOrders(data);
        AsyncStorage.setItem("buyer_orders_cache", JSON.stringify(data)).catch(
          () => {},
        );
      }
    } catch (error) {
      console.warn("Failed to load invoices via direct API:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusRefresh(refresh);

  const totals = useMemo(() => {
    const paid = orders.filter(
      (order) => order.status === "Paid" || order.payment_status === "Verified",
    );
    const unpaid = orders.filter(
      (order) => order.status !== "Paid" && order.payment_status !== "Verified",
    );
    return {
      paid: paid.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0,
      ),
      unpaid: unpaid.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0,
      ),
    };
  }, [orders]);

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
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
        <Text className="text-3xl font-black text-[#2A5C43]">Invoices</Text>
        <Text className="text-gray-500 mt-1 mb-5">
          Order invoices generated from your live purchase history.
        </Text>

        <View className="flex-row gap-3 mb-4">
          <Metric
            label="Paid"
            value={`KES ${totals.paid.toLocaleString()}`}
            icon="verified"
          />
          <Metric
            label="Outstanding"
            value={`KES ${totals.unpaid.toLocaleString()}`}
            icon="pending-actions"
          />
        </View>

        {/* Skeleton Loading Cards */}
        {isLoading && (
          <View>
            {[1, 2, 3].map((key) => (
              <View
                key={key}
                className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 opacity-70"
              >
                <View className="flex-row justify-between mb-3">
                  <View className="h-6 w-1/3 bg-gray-200 rounded-full" />
                  <View className="h-5 w-16 bg-gray-200 rounded-full" />
                </View>
                <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-2" />
                <View className="h-4 w-1/3 bg-gray-200 rounded-full mb-2" />
                <View className="h-5 w-2/5 bg-gray-200 rounded-full mb-2" />
                <View className="h-4 w-1/4 bg-gray-200 rounded-full" />
              </View>
            ))}
          </View>
        )}

        {!isLoading && orders.length === 0 && (
          <View className="items-center py-16">
            <MaterialIcons name="receipt-long" size={48} color="#d1d5db" />
            <Text className="text-gray-400 font-black text-lg mt-4">
              No invoices generated
            </Text>
          </View>
        )}

        {!isLoading &&
          orders.map((order) => {
          const paid =
            order.status === "Paid" || order.payment_status === "Verified";
          return (
            <View
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 mb-3"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-black text-[#2A5C43]">
                    Invoice #{shortHash(order.id)}
                  </Text>
                  <Text className="text-gray-700 mt-1">{order.produce}</Text>
                </View>
                <View
                  className={`rounded-full px-3 py-1 ${paid ? "bg-[#E7F5EE]" : "bg-amber-100"}`}
                >
                  <Text
                    className={`text-[11px] uppercase font-black ${paid ? "text-[#2A5C43]" : "text-amber-700"}`}
                  >
                    {paid ? "Paid" : "Due"}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-700 mt-3">
                Quantity: {Number(order.quantity || 0).toLocaleString()} kg
              </Text>
              <Text className="text-gray-700">
                Unit price: KES {Number(order.unit_price || 0).toLocaleString()}
              </Text>
              <Text className="text-gray-900 font-black mt-1">
                Total: KES {Number(order.total_amount || 0).toLocaleString()}
              </Text>
              <Text className="text-gray-500 mt-1">
                {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </View>
          );
        })}
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
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 min-h-[110px]">
      <MaterialIcons name={icon} size={21} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">
        {label}
      </Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  );
}
