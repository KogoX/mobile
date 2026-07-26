import { useFocusRefresh } from "../../lib/polling";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { shortHash } from "../../components/Toast";

type Order = {
  id: number;
  farmer?: string | null;
  yield_id?: number | null;
  quantity: string;
  produce: string;
  status: string;
  payment_status: string | null;
  tracking_location?: string;
  estimated_delivery?: string;
  created_at: string;
};

let _inMemoryTrackCache: Order[] | null = null;

export default function BuyerTrack() {
  const [orders, setOrders] = useState<Order[]>(() => _inMemoryTrackCache || []);
  const [isLoading, setIsLoading] = useState(() => !_inMemoryTrackCache);
  const [refreshing, setRefreshing] = useState(false);

  const loadFromCache = useCallback(() => {
    AsyncStorage.getItem("buyer_orders_cache").then((cached) => {
      if (cached) {
        try {
          const parsed: Order[] = JSON.parse(cached);
          const trackable = parsed.filter(
            (o: Order) => String(o.status).toLowerCase() !== "cancelled",
          );
          _inMemoryTrackCache = trackable;
          setOrders(trackable);
          setIsLoading(false);
        } catch {}
      }
    });
  }, []);

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      if (isManual) clearApiCache();
      const res = await api.get("/orders");
      const data = res.data;
      if (Array.isArray(data)) {
        const trackable = data.filter(
          (o: Order) => String(o.status).toLowerCase() !== "cancelled",
        );
        _inMemoryTrackCache = trackable;
        setOrders(trackable);
        AsyncStorage.setItem("buyer_orders_cache", JSON.stringify(data)).catch(
          () => {},
        );
      }
    } catch (error) {
      console.warn("Failed to load tracking orders via direct API, trying fallback:", error);
      fetchWithCache("/orders").then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const trackable = res.data.filter(
            (o: Order) => String(o.status).toLowerCase() !== "cancelled",
          );
          setOrders(trackable);
        }
      }).catch(() => {});
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Instant 0ms hydration on mount & tab focus + live API refresh
  useFocusEffect(
    useCallback(() => {
      loadFromCache();
      refresh();
    }, [loadFromCache, refresh]),
  );

  useFocusRefresh(refresh);

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
        <Text className="text-3xl font-black text-[#2A5C43]">
          Track Shipments
        </Text>
        <Text className="text-gray-500 mt-1 mb-5">
          Monitor your active produce orders in real-time.
        </Text>

        {isLoading && (
          <View>
            {[1, 2].map((key) => (
              <View
                key={key}
                className="bg-white rounded-2xl p-6 border border-gray-100 mb-4 opacity-70"
              >
                <View className="h-6 w-1/3 bg-gray-200 rounded-full mb-6" />
                <View className="flex-row gap-4">
                  <View className="items-center">
                    <View className="w-4 h-4 rounded-full bg-gray-200" />
                    <View className="w-1 h-12 bg-gray-200 -mt-1" />
                    <View className="w-4 h-4 rounded-full bg-gray-200" />
                  </View>
                  <View className="flex-1">
                    <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-8" />
                    <View className="h-4 w-1/2 bg-gray-200 rounded-full" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!isLoading && orders.length === 0 && (
          <View className="items-center py-16">
            <MaterialIcons name="local-shipping" size={48} color="#d1d5db" />
            <Text className="text-gray-400 font-black text-lg mt-4">
              No active shipments
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              When you pay for an order, you can track its journey here.
            </Text>
          </View>
        )}

        {!isLoading &&
          orders.map((order) => {
            return (
              <View
                key={order.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 mb-4"
              >
                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-lg font-black text-[#2A5C43]">
                      {order.produce}
                    </Text>
                    <Text className="text-gray-500 font-bold text-sm">
                      Order #{shortHash(order.id)}
                    </Text>
                  </View>
                  <View className="bg-[#e8f3ee] px-3 py-1 rounded-full">
                    <Text className="text-[#2A5C43] font-bold text-xs">
                      {Number(order.quantity).toLocaleString()} kg
                    </Text>
                  </View>
                </View>

                {/* Live Shipment Location Banner */}
                {order.tracking_location ? (
                  <View className="bg-[#E7F5EE] border border-[#BDE3D0] rounded-xl p-3 mb-5 flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-[#2A5C43] items-center justify-center">
                      <MaterialIcons name="my-location" size={18} color="#ffffff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] uppercase font-black text-[#2A5C43]">
                        Live Transit Location
                      </Text>
                      <Text className="text-sm font-bold text-gray-900 mt-0.5">
                        📍 {order.tracking_location}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {order.estimated_delivery ? (
                  <View className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 flex-row items-center justify-between">
                    <Text className="text-xs text-gray-500 font-bold uppercase">
                      Est. Arrival Date:
                    </Text>
                    <Text className="text-sm font-black text-[#2A5C43]">
                      📅 {new Date(order.estimated_delivery).toLocaleDateString()}
                    </Text>
                  </View>
                ) : null}

                {(() => {
                  const isPaid =
                    order.status === "Paid" ||
                    order.payment_status === "Verified";
                  const steps = [
                    { label: "Order Booked", active: true },
                    { label: "Payment Verified", active: isPaid },
                    {
                      label: "In Transit",
                      active: [
                        "Picked Up",
                        "In Transit",
                        "Ready for Pickup",
                        "Fulfilled",
                      ].includes(order.status),
                    },
                    {
                      label: "Ready / Delivered",
                      active: ["Ready for Pickup", "Fulfilled"].includes(
                        order.status,
                      ),
                    },
                  ];
                  return (
                    <View className="pl-2">
                      {steps.map((step, index, arr) => (
                        <View key={step.label} className="flex-row">
                          <View className="items-center mr-4">
                            <View
                              className={`w-4 h-4 rounded-full ${step.active ? "bg-[#2A5C43]" : "bg-gray-300 border-2 border-white"} z-10`}
                            />
                            {index < arr.length - 1 && (
                              <View
                                className={`w-1 h-12 ${arr[index + 1].active ? "bg-[#2A5C43]" : "bg-gray-200"} -mt-1`}
                              />
                            )}
                          </View>
                          <View className="pt-0 flex-1 pb-4">
                            <Text
                              className={`font-black ${step.active ? "text-[#2A5C43]" : "text-gray-400"}`}
                            >
                              {step.label}
                            </Text>
                            {step.label === "In Transit" &&
                            step.active &&
                            order.tracking_location ? (
                              <Text className="text-xs text-gray-500 font-bold mt-0.5">
                                Current Stop: {order.tracking_location}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
