import { useFocusRefresh } from "../../lib/polling";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { shortHash } from "../../components/Toast";
import PaystackModal from "../../components/PaystackModal";
import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { generateAndSharePDF, openPdfPreviewWindow } from "../../lib/pdfReport";
import { getSessionUser } from "../../lib/session";

type Order = {
  id: number;
  farmer?: string | null;
  yield_id?: number | null;
  quantity: string;
  produce: string;
  unit_price: string;
  total_amount: string;
  status: string;
  payment_status: string | null;
  tracking_location?: string;
  estimated_delivery?: string;
  photos?: string[];
  created_at: string;
};

let _inMemoryOrdersCache: Order[] | null = null;

export default function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>(() => _inMemoryOrdersCache || []);
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(() => !_inMemoryOrdersCache);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [buyerName, setBuyerName] = useState("Buyer");
  const [userUniqueId, setUserUniqueId] = useState("");
  const router = useRouter();

  const loadFromCache = useCallback(() => {
    if (_inMemoryOrdersCache) {
      setOrders(_inMemoryOrdersCache);
      setIsLoading(false);
    }
    getSessionUser().then((user) => {
      if (user?.name) setBuyerName(user.name);
      if (user?.unique_id) setUserUniqueId(user.unique_id);
    });
    AsyncStorage.getItem("buyer_orders_cache").then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          _inMemoryOrdersCache = parsed;
          setOrders(parsed);
          setIsLoading(false);
        } catch {}
      }
    });
  }, []);

  const handleExportPDF = async () => {
    if (orders.length === 0 || exporting) return;
    const previewWindow = openPdfPreviewWindow(
      "Preparing buyer statement...",
      "Your PDF preview will open here in a moment.",
    );

    setExporting(true);
    try {
      await generateAndSharePDF({
        title: "Buyer Procurement Statement",
        reportType: "buyer_procurement",
        userName: buyerName,
        userUniqueId: userUniqueId,
        periodLabel: "All Time",
        items: orders,
        webPreviewWindow: previewWindow,
      });
    } catch (e) {
      console.warn("Buyer orders PDF error:", e);
      if (previewWindow && !previewWindow.closed) {
        previewWindow.document.body.innerHTML =
          "<p style=\"font-family: Arial, sans-serif; color: #991B1B; padding: 24px;\">Unable to generate the buyer statement. Please try again.</p>";
      }
    } finally {
      setExporting(false);
    }
  };

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
      const res = await fetchWithCache("/orders", { preferCache: !isManual });
      const data = res.data;
      if (Array.isArray(data)) {
        _inMemoryOrdersCache = data;
        setOrders(data);
        AsyncStorage.setItem("buyer_orders_cache", JSON.stringify(data)).catch(
          () => {},
        );
      }
    } catch (error) {
      console.warn("Failed to load orders via direct API, trying cache fallback:", error);
      fetchWithCache("/orders").then((res) => {
        if (res.data) setOrders(res.data);
      }).catch(() => {});
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusRefresh(refresh);

  // Paystack Modal Popup state
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [paystackRef, setPaystackRef] = useState<string | null>(null);

  async function startPayment(order: Order) {
    try {
      setPayingOrderId(order.id);
      const returnUrl = Linking.createURL("payment-complete");

      const { data } = await api.post("/payments/initialize", {
        order_id: order.id,
        method: "checkout",
        callback_url: returnUrl,
      });

      if (!data.authorization_url) {
        throw new Error("Paystack did not return a checkout link.");
      }

      setPaystackRef(data.reference);
      setPaystackUrl(data.authorization_url);
    } catch (error: any) {
      Alert.alert(
        "Payment failed",
        error?.response?.data?.error || error.message,
      );
      setPayingOrderId(null);
    }
  }

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
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-3xl font-black text-[#2A5C43]">
              Orders & Payments
            </Text>
            <Text className="text-gray-500 mt-1 mb-5">
              Pay securely through Paystack Checkout.
            </Text>
          </View>

          <Pressable
            onPress={handleExportPDF}
            disabled={orders.length === 0 || exporting}
            style={{ backgroundColor: orders.length > 0 ? "#2A5C43" : "#9CA3AF" }}
            className="px-3.5 py-2.5 rounded-xl flex-row items-center shadow-sm -mt-4"
          >
            <MaterialIcons name="picture-as-pdf" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs ml-1.5">
              {exporting ? "PDF..." : "Statement"}
            </Text>
          </Pressable>
        </View>

        {isLoading && (
          <View>
            {[1, 2, 3].map((key) => (
              <View
                key={key}
                className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 opacity-70"
              >
                <View className="h-6 w-1/3 bg-gray-200 rounded-full mb-2" />
                <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-1" />
                <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-1" />
                <View className="h-4 w-2/3 bg-gray-200 rounded-full mb-2" />
                <View className="h-5 w-1/4 bg-gray-200 rounded-full mb-2" />
                <View className="h-4 w-1/2 bg-gray-200 rounded-full mb-4" />
                <View className="h-12 w-full bg-gray-200 rounded-xl" />
              </View>
            ))}
          </View>
        )}

        {!isLoading && orders.length === 0 && (
          <View className="items-center py-16">
            <MaterialIcons name="receipt-long" size={48} color="#d1d5db" />
            <Text className="text-gray-400 font-black text-lg mt-4">
              No orders found
            </Text>
          </View>
        )}

        {!isLoading &&
          orders.map((order) => {
            const isPaid =
              order.status === "Paid" || order.payment_status === "Verified";
            const processingPayment = payingOrderId === order.id;

            return (
              <View
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 mb-3"
              >
                <OrderPhotoCarousel photos={order.photos || []} />
                <Text className="text-lg font-black text-[#2A5C43]">
                  Order #{shortHash(order.id)}
                </Text>
                <Text className="text-gray-700 mt-1">{order.produce}</Text>
                <Text className="text-gray-700">
                  Qty: {Number(order.quantity).toLocaleString()} kg
                </Text>
                <Text className="text-gray-700">
                  Unit Price: KES {Number(order.unit_price).toLocaleString()}
                </Text>
                <Text className="text-gray-700">
                  Fulfillment:{" "}
                  {order.farmer
                    ? `${order.farmer} harvest #${order.yield_id ? shortHash(order.yield_id) : "unassigned"}`
                    : "Awaiting manager match"}
                </Text>
                <Text className="text-gray-900 font-bold mt-1">
                  Total: KES {Number(order.total_amount).toLocaleString()}
                </Text>
                <Text className="text-sm mt-1 text-gray-500">
                  Status:{" "}
                  <Text className="font-bold text-[#2A5C43]">
                    {order.status && order.status !== "Processing" ? order.status : (isPaid ? "Payment Verified" : "Processing")}
                  </Text>
                  {" "}• {new Date(order.created_at).toLocaleDateString()}
                </Text>

                {order.tracking_location ? (
                  <View className="bg-[#E7F5EE] border border-[#BDE3D0] rounded-xl p-2.5 mt-2 flex-row items-center gap-2">
                    <MaterialIcons name="my-location" size={16} color="#2A5C43" />
                    <Text className="text-xs font-bold text-[#2A5C43] flex-1">
                      Live Transit Location: {order.tracking_location}
                    </Text>
                  </View>
                ) : null}

                {!isPaid ? (
                  <Pressable
                    className={`mt-4 rounded-xl py-3.5 px-4 items-center border ${
                      processingPayment
                        ? "bg-[#6d9a86] border-[#6d9a86]"
                        : "bg-[#2A5C43] border-[#1f4934]"
                    }`}
                    onPress={() => startPayment(order)}
                    disabled={processingPayment}
                  >
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons name="lock" size={18} color="#ffffff" />
                      <Text className="text-white font-black text-base">
                        {processingPayment
                          ? "Opening Paystack..."
                          : "Pay with Paystack"}
                      </Text>
                    </View>
                    {!processingPayment ? (
                      <Text className="text-[#D7F3E5] text-xs font-bold mt-1 text-center">
                        M-Pesa, card, bank and other enabled methods
                      </Text>
                    ) : null}
                  </Pressable>
                ) : (
                  <Pressable
                    className="mt-3 rounded-xl py-3 items-center bg-[#125C3F]"
                    onPress={() => router.push("/buyer/track")}
                  >
                    <Text className="text-white font-black">
                      Track Shipment
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
      </ScrollView>

      <PaystackModal
        visible={Boolean(paystackUrl)}
        authUrl={paystackUrl}
        reference={paystackRef}
        onSuccess={async () => {
          const currentPayingId = payingOrderId;
          setPaystackUrl(null);
          setPaystackRef(null);
          setPayingOrderId(null);

          // Instant 0ms local state & storage update
          if (currentPayingId) {
            setOrders((prev) => {
              const updated = prev.map((o) =>
                o.id === currentPayingId
                  ? { ...o, status: "Paid", payment_status: "Verified" }
                  : o,
              );
              _inMemoryOrdersCache = updated;
              AsyncStorage.setItem(
                "buyer_orders_cache",
                JSON.stringify(updated),
              ).catch(() => {});
              return updated;
            });
          }

          Alert.alert(
            "Payment Verified ✓",
            "Thank you! Your payment has been received and verified successfully.",
          );
          await refresh();
        }}
        onCancel={() => {
          setPaystackUrl(null);
          setPaystackRef(null);
          setPayingOrderId(null);
        }}
      />
    </SafeAreaView>
  );
}

function OrderPhotoCarousel({ photos }: { photos: string[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(Math.min(width - 72, 720));

  if (!photos.length) return null;

  const goToPhoto = (index: number) => {
    const nextIndex = (index + photos.length) % photos.length;
    setActiveIndex(nextIndex);
    scrollRef.current?.scrollTo({
      x: nextIndex * carouselWidth,
      animated: true,
    });
  };

  return (
    <View
      className="relative rounded-xl overflow-hidden mb-4 bg-[#E7F5EE]"
      onLayout={(event) => setCarouselWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / carouselWidth,
          );
          setActiveIndex(Math.max(0, Math.min(nextIndex, photos.length - 1)));
        }}
      >
        {photos.map((uri, index) => (
          <Image
            key={`${uri}-${index}`}
            source={{ uri }}
            style={{ width: carouselWidth, height: 210 }}
            contentFit="cover"
          />
        ))}
      </ScrollView>

      {photos.length > 1 ? (
        <>
          <Pressable
            onPress={() => goToPhoto(activeIndex - 1)}
            className="absolute left-3 top-[85px] h-10 w-10 rounded-full bg-black/55 items-center justify-center active:bg-black/75"
          >
            <MaterialIcons name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={() => goToPhoto(activeIndex + 1)}
            className="absolute right-3 top-[85px] h-10 w-10 rounded-full bg-black/55 items-center justify-center active:bg-black/75"
          >
            <MaterialIcons name="chevron-right" size={24} color="#ffffff" />
          </Pressable>
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
            {photos.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${activeIndex === index ? "w-5 bg-white" : "w-2 bg-white/55"}`}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
