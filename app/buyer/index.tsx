import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState, useRef } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
  Dimensions,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { useFocusRefresh } from "../../lib/polling";
import { notifyNewListing } from "../../lib/notifications";
import { getSessionUser } from "../../lib/session";
import NotificationBell from "../../components/NotificationBell";
import PeriodSelector, { PeriodFilter } from "../../components/PeriodSelector";
import { generateAndSharePDF } from "../../lib/pdfReport";

type Listing = {
  id: string;
  farmer: string;
  farmer_id: string;
  crop_season: string;
  variety: string;
  quantity: string;
  grade: string;
  status: string;
  photos: string[];
  created_at: string;
};

const listingCountKey = "buyerListingCount";
const screenWidth = Dimensions.get("window").width;

export function getBuyerUnitPrice(grade?: string): number {
  const g = (grade || "A").toUpperCase().replace("GRADE", "").trim();
  if (g === "B") return 110;
  if (g === "C") return 80;
  return 160; // Grade A default
}

let _inMemoryMarketCache: Listing[] | null = null;

export default function BuyerDashboard() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(() => _inMemoryMarketCache || []);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [grade, setGrade] = useState("All Grades");
  const [quantity, setQuantity] = useState("50");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState("Buyer");
  const [uniqueId, setUniqueId] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => !_inMemoryMarketCache);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photoScrollViewRef = useRef<ScrollView>(null);

  const [exportingReport, setExportingReport] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>({
    preset: "all",
    label: "All Time",
  });

  const handleExportBuyerReport = async () => {
    if (exportingReport) return;
    setExportingReport(true);
    try {
      let queryUrl = "/orders";
      const params: string[] = [];
      if (period.startDate) params.push(`startDate=${period.startDate}`);
      if (period.endDate) params.push(`endDate=${period.endDate}`);
      if (params.length > 0) queryUrl += `?${params.join("&")}`;

      const { data } = await api.get(queryUrl);
      await generateAndSharePDF({
        title: "Buyer Procurement Statement",
        reportType: "buyer_procurement",
        userName: buyerName || "Buyer",
        userUniqueId: uniqueId,
        periodLabel: period.label,
        items: data || activeOrders,
      });
    } catch (e: any) {
      console.warn("Buyer report export error:", e);
    } finally {
      setExportingReport(false);
    }
  };

  const approvedListings = useMemo(
    () =>
      listings.filter(
        (item) =>
          ["Approved", "Scheduled", "Exported"].includes(item.status) &&
          (grade === "All Grades" ||
            grade === "All" ||
            item.grade === grade ||
            `Grade ${item.grade}` === grade),
      ),
    [grade, listings],
  );

  const totalAvailable = useMemo(
    () =>
      approvedListings.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      ),
    [approvedListings],
  );

  const loadFromCache = useCallback(() => {
    if (_inMemoryMarketCache) {
      setListings(_inMemoryMarketCache);
      setIsLoading(false);
    }
    getSessionUser().then((user) => {
      if (user?.name) setBuyerName(user.name);
      if (user?.unique_id) setUniqueId(user.unique_id);
    });

    AsyncStorage.getItem("buyer_market_cache").then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          _inMemoryMarketCache = parsed;
          setListings(parsed);
          setIsLoading(false);
        } catch {}
      }
    });
  }, []);

  // Instant 0ms hydration on mount & tab focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      loadFromCache();
      refresh();
      return () => { isMounted = false; };
    }, [loadFromCache]),
  );

  const refresh = useCallback(async () => {
    try {
      getSessionUser()
        .then((user) => {
          if (user?.name) setBuyerName(user.name);
          if (user?.unique_id) setUniqueId(user.unique_id);
        })
        .catch(console.error);

      fetchWithCache("/orders")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setActiveOrders(
              res.data.filter(
                (o: any) => !["Fulfilled", "Cancelled"].includes(o.status),
              ),
            );
          }
        })
        .catch(console.error);

      fetchWithCache("/yields")
        .then(async (res) => {
          if (Array.isArray(res.data)) {
            const nextListings = res.data as Listing[];
            const visible = nextListings.filter(
              (item) => item.status === "Approved",
            );
            const previousRaw = await AsyncStorage.getItem(listingCountKey);
            const previousCount = previousRaw
              ? Number(previousRaw)
              : visible.length;

            if (visible.length > previousCount) {
              await notifyNewListing(
                "New avocado listing",
                `${visible.length - previousCount} fresh harvest listing(s) are available.`,
              );
            }

            await AsyncStorage.setItem(listingCountKey, String(visible.length));
            _inMemoryMarketCache = nextListings;
            setListings(nextListings);
            AsyncStorage.setItem(
              "buyer_market_cache",
              JSON.stringify(nextListings),
            ).catch(() => {});
          }
        })
        .catch(() => {});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusRefresh(refresh);

  async function createOrder(listing: Listing) {
    const requested = Number(quantity || 0);
    if (!requested) {
      Alert.alert("Missing quantity", "Enter order quantity in kg.");
      return;
    }
    if (requested > Number(listing.quantity || 0)) {
      Alert.alert(
        "Quantity too high",
        "Choose a quantity within the available listing volume.",
      );
      return;
    }

    // Double order placement prevention: lock UI with loading spinner & early return
    if (creatingId) return;

    try {
      setCreatingId(listing.id);
      const unitRate = getBuyerUnitPrice(listing.grade);
      const res = await api.post("/orders", {
        quantity: requested,
        unitPrice: unitRate,
        produce: listing.variety,
        yield_id: listing.id,
      });

      // Instantly update buyer_orders_cache in AsyncStorage
      if (res.data) {
        clearApiCache();
        try {
          const cached = await AsyncStorage.getItem("buyer_orders_cache");
          const parsed = cached ? JSON.parse(cached) : [];
          const updated = [
            res.data,
            ...parsed.filter((o: any) => o.id !== res.data.id),
          ];
          await AsyncStorage.setItem(
            "buyer_orders_cache",
            JSON.stringify(updated),
          );
        } catch {}
      }

      setSelectedListing(null);
      Alert.alert(
        "Harvest Booked ✓",
        "You've successfully reserved this harvest. Proceed to pay to lock it in.",
      );
      router.push("/buyer/orders");
    } catch (error: any) {
      Alert.alert(
        "Unable to create order",
        error?.response?.data?.error || error.message,
      );
    } finally {
      setCreatingId(null);
    }
  }

  const handleNextPhoto = (photosCount: number) => {
    const nextIndex = (activePhotoIndex + 1) % photosCount;
    setActivePhotoIndex(nextIndex);
    const modalWidth =
      Platform.OS === "web" && screenWidth > 600 ? 480 : screenWidth;
    photoScrollViewRef.current?.scrollTo({
      x: nextIndex * modalWidth,
      animated: true,
    });
  };

  const handlePrevPhoto = (photosCount: number) => {
    const prevIndex = (activePhotoIndex - 1 + photosCount) % photosCount;
    setActivePhotoIndex(prevIndex);
    const modalWidth =
      Platform.OS === "web" && screenWidth > 600 ? 480 : screenWidth;
    photoScrollViewRef.current?.scrollTo({
      x: prevIndex * modalWidth,
      animated: true,
    });
  };

  const grades = ["All Grades", "A", "B", "C"];

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <FlatList
        data={approvedListings}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        keyExtractor={(item) => item.id}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className="bg-[#125C3F] px-5 pt-6 pb-8">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white text-sm font-bold opacity-70">
                  Welcome, {buyerName}
                </Text>
                <NotificationBell color="#ffffff" />
              </View>
              <View className="flex-row items-center justify-between mt-1">
                <View>
                  <Text className="text-white text-3xl font-black">
                    Avocado Market
                  </Text>
                  <Text className="text-[#D7F3E5] mt-0.5 text-xs">
                    Verified Kenyan harvests, ready for export
                  </Text>
                </View>

                <Pressable
                  onPress={handleExportBuyerReport}
                  disabled={exportingReport}
                  className="bg-[#BDF264] px-3 py-2 rounded-xl flex-row items-center shadow-sm"
                >
                  <MaterialIcons name="picture-as-pdf" size={16} color="#125C3F" />
                  <Text className="text-[#125C3F] font-black text-xs ml-1">
                    {exportingReport ? "PDF..." : "Report"}
                  </Text>
                </Pressable>
              </View>

              {uniqueId ? (
                <View className="self-start bg-white/15 rounded-full px-3 py-1 mt-3">
                  <Text className="text-white text-[11px] font-black uppercase">
                    Buyer ID: {uniqueId}
                  </Text>
                </View>
              ) : null}

              <View className="mt-3">
                <PeriodSelector
                  selectedPeriod={period}
                  onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
                  accentColor="#BDF264"
                />
              </View>

              {/* Summary pill */}
              <View className="flex-row gap-3 mt-4">
                <View className="flex-1 bg-white/10 rounded-2xl p-3">
                  <Text className="text-[#BDF264] text-2xl font-black">
                    {approvedListings.length}
                  </Text>
                  <Text className="text-[#D7F3E5] text-xs font-bold mt-1 uppercase">
                    Listings
                  </Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-2xl p-3">
                  <Text className="text-[#BDF264] text-2xl font-black">
                    {totalAvailable.toLocaleString()} kg
                  </Text>
                  <Text className="text-[#D7F3E5] text-xs font-bold mt-1 uppercase">
                    Available
                  </Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-2xl p-3">
                  <Text className="text-[#BDF264] text-2xl font-black">
                    {getBuyerUnitPrice(grade).toLocaleString()}
                  </Text>
                  <Text className="text-[#D7F3E5] text-xs font-bold mt-1 uppercase">
                    KES / kg
                  </Text>
                </View>
              </View>
            </View>

            <View className="px-5 -mt-4">
              {/* Filter bar */}
              <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5">
                <Text className="text-[11px] font-black text-gray-500 uppercase mb-3">
                  Filter Listings
                </Text>
                <View className="flex-row gap-2 mb-3">
                  {grades.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setGrade(g)}
                      className={`flex-1 py-2 rounded-full items-center ${
                        grade === g ? "bg-[#2A5C43]" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          grade === g ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {g === "All Grades" ? "All" : `Grade ${g}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View>
                  <Text className="text-[11px] font-black text-gray-500 uppercase mb-1">
                    Order Quantity (kg)
                  </Text>
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    className="min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-800"
                    style={{ outlineStyle: "none" } as never}
                    placeholder="Enter quantity"
                    placeholderTextColor="#A1A1AA"
                  />
                </View>
              </View>

              {/* No listings */}
              {!isLoading && approvedListings.length === 0 && (
                <View className="items-center py-16">
                  <MaterialIcons name="eco" size={56} color="#d1d5db" />
                  <Text className="text-gray-400 font-black text-lg mt-4">
                    No listings available
                  </Text>
                  <Text className="text-gray-400 text-sm text-center mt-1 px-8">
                    Once a manager verifies a farmer harvest, it will appear
                    here.
                  </Text>
                </View>
              )}

              {/* Loading Skeletons */}
              {isLoading && (
                <View>
                  {[1, 2, 3].map((key) => (
                    <View
                      key={key}
                      className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-white opacity-70"
                    >
                      <View className="h-[140px] bg-gray-200" />
                      <View className="p-4">
                        <View className="h-4 w-1/3 bg-gray-200 rounded-full mb-3" />
                        <View className="h-6 w-1/2 bg-gray-200 rounded-full mb-2" />
                        <View className="h-4 w-2/3 bg-gray-200 rounded-full mb-5" />
                        <View className="flex-row gap-3">
                          <View className="flex-1 h-8 bg-gray-200 rounded-lg" />
                          <View className="flex-1 h-8 bg-gray-200 rounded-lg" />
                          <View className="flex-1 h-8 bg-gray-200 rounded-lg" />
                        </View>
                        <View className="mt-5 h-12 w-full bg-gray-200 rounded-full" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        }
        renderItem={({ item: listing, index }: any) => {
          const isFeatured = index === 0;
          const hasPhoto = listing.photos?.length > 0;

          return (
            <Pressable
              key={listing.id}
              onPress={() => {
                setActivePhotoIndex(0);
                setSelectedListing(listing);
              }}
              className="mb-4 rounded-2xl overflow-hidden border border-gray-200 active:opacity-90"
              style={{ backgroundColor: isFeatured ? "#125C3F" : "#ffffff" }}
            >
              {/* Photo */}
              {hasPhoto ? (
                <View className="relative">
                  <Image
                    source={{ uri: listing.photos[0] }}
                    style={{ width: "100%", height: 200 }}
                    contentFit="cover"
                    transition={300}
                  />
                  {/* Photo count badge */}
                  {listing.photos.length > 1 && (
                    <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-2 py-1 flex-row items-center gap-1">
                      <MaterialIcons
                        name="photo-library"
                        size={12}
                        color="#fff"
                      />
                      <Text className="text-white text-xs font-bold">
                        {listing.photos.length}
                      </Text>
                    </View>
                  )}
                  {isFeatured && (
                    <View className="absolute top-3 left-3 bg-[#BDF264] rounded-full px-3 py-1">
                      <Text className="text-[#125C3F] text-[10px] font-black uppercase">
                        ⭐ Featured
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View
                  className="h-[140px] items-center justify-center"
                  style={{
                    backgroundColor: isFeatured ? "#0d4a2f" : "#E7F5EE",
                  }}
                >
                  <MaterialIcons
                    name="eco"
                    size={48}
                    color={isFeatured ? "#BDF264" : "#2A5C43"}
                  />
                  {isFeatured && (
                    <View className="absolute top-3 left-3 bg-[#BDF264] rounded-full px-3 py-1">
                      <Text className="text-[#125C3F] text-[10px] font-black uppercase">
                        ⭐ Featured
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Content */}
              <View className="p-4">
                {/* Grade + verified badge row */}
                <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                  <View
                    className="rounded-full px-3 py-1"
                    style={{
                      backgroundColor: isFeatured ? "#BDF264" : "#E7F5EE",
                    }}
                  >
                    <Text
                      className="text-[10px] font-black uppercase"
                      style={{ color: "#125C3F" }}
                    >
                      {listing.grade === "A"
                        ? "Premium Grade A"
                        : `Grade ${listing.grade}`}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                    <MaterialIcons
                      name="verified"
                      size={12}
                      color={isFeatured ? "#BDF264" : "#2A5C43"}
                    />
                    <Text
                      className="text-[10px] font-black"
                      style={{ color: isFeatured ? "#BDF264" : "#2A5C43" }}
                    >
                      Manager Verified
                    </Text>
                  </View>
                  {listing.status === "Scheduled" && (
                    <View className="bg-blue-100 rounded-full px-2 py-1">
                      <Text className="text-blue-700 text-[10px] font-black uppercase">
                        Scheduled
                      </Text>
                    </View>
                  )}
                </View>

                {/* Farmer + variety */}
                <Text
                  className="text-xl font-black"
                  style={{ color: isFeatured ? "#ffffff" : "#1b1b1b" }}
                >
                  {listing.farmer || "Cooperative Harvest"}
                </Text>
                <Text
                  style={{ color: isFeatured ? "#D7F3E5" : "#6b7280" }}
                  className="mt-0.5"
                >
                  {listing.variety} · {listing.crop_season}
                </Text>

                {/* Stats row */}
                <View className="flex-row gap-3 mt-4">
                  <InfoChip
                    label="Available"
                    value={`${Number(listing.quantity || 0).toLocaleString()} kg`}
                    dark={isFeatured}
                  />
                  <InfoChip
                    label="Price"
                    value="KES 1,200/kg"
                    dark={isFeatured}
                  />
                  <InfoChip
                    label="Harvest"
                    value={new Date(listing.created_at).toLocaleDateString()}
                    dark={isFeatured}
                  />
                </View>

                {/* CTA */}
                <Pressable
                  onPress={() => {
                    setActivePhotoIndex(0);
                    setSelectedListing(listing);
                  }}
                  className={`mt-4 rounded-full py-3.5 items-center ${
                    isFeatured ? "bg-[#BDF264]" : "bg-[#2A5C43]"
                  }`}
                >
                  <Text
                    className="font-black text-sm"
                    style={{ color: isFeatured ? "#125C3F" : "#ffffff" }}
                  >
                    {creatingId === listing.id
                      ? "Creating..."
                      : "View & Order →"}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      {/* Listing detail modal */}
      <Modal
        visible={Boolean(selectedListing)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedListing(null)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setSelectedListing(null)}
        >
          <View
            className="bg-white rounded-t-3xl w-full max-w-[480px] self-center"
            style={{ maxHeight: "85%" }}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView>
              {/* Photos with Navigation Arrows */}
              {selectedListing?.photos?.length ? (
                <View className="relative">
                  <ScrollView
                    ref={photoScrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                      const offset = e.nativeEvent.contentOffset.x;
                      const modalWidth =
                        Platform.OS === "web" && screenWidth > 600
                          ? 480
                          : screenWidth;
                      const index = Math.round(offset / modalWidth);
                      setActivePhotoIndex(index);
                    }}
                  >
                    {selectedListing.photos.map((uri, i) => {
                      const modalWidth =
                        Platform.OS === "web" && screenWidth > 600
                          ? 480
                          : screenWidth;
                      return (
                        <Pressable key={i} onPress={() => setPhotoModal(uri)}>
                          <Image
                            source={{ uri }}
                            style={{ width: modalWidth, height: 240 }}
                            contentFit="cover"
                          />
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Left Navigation Arrow */}
                  {selectedListing.photos.length > 1 && (
                    <Pressable
                      onPress={() =>
                        handlePrevPhoto(selectedListing.photos.length)
                      }
                      className="absolute left-3 top-[100px] bg-black/50 w-10 h-10 rounded-full items-center justify-center active:bg-black/75"
                    >
                      <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color="#fff"
                      />
                    </Pressable>
                  )}

                  {/* Right Navigation Arrow */}
                  {selectedListing.photos.length > 1 && (
                    <Pressable
                      onPress={() =>
                        handleNextPhoto(selectedListing.photos.length)
                      }
                      className="absolute right-3 top-[100px] bg-black/50 w-10 h-10 rounded-full items-center justify-center active:bg-black/75"
                    >
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="#fff"
                      />
                    </Pressable>
                  )}

                  {/* Photo Index Indicator */}
                  {selectedListing.photos.length > 1 && (
                    <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
                      {selectedListing.photos.map((_, i) => (
                        <View
                          key={i}
                          className={`h-2 rounded-full ${
                            activePhotoIndex === i
                              ? "w-4 bg-white"
                              : "w-2 bg-white/50"
                          }`}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View className="h-[160px] bg-[#E7F5EE] items-center justify-center rounded-t-3xl">
                  <MaterialIcons name="eco" size={52} color="#2A5C43" />
                </View>
              )}

              <View className="p-5">
                {/* Header */}
                <View className="flex-row items-center gap-2 mb-1">
                  <MaterialIcons name="verified" size={18} color="#2A5C43" />
                  <Text className="text-xs text-[#2A5C43] font-black uppercase">
                    Manager Verified
                  </Text>
                </View>
                <Text className="text-2xl font-black text-gray-900">
                  {selectedListing?.farmer || "Cooperative Harvest"}
                </Text>
                <Text className="text-gray-500 mt-1">
                  {selectedListing?.variety} · {selectedListing?.crop_season}
                </Text>

                {/* Details & Interactive Quantity Selector */}
                <View className="bg-[#F4FBF7] rounded-2xl p-4 mt-4 gap-3">
                  <DetailRow
                    icon="grade"
                    label="Grade"
                    value={
                      selectedListing?.grade === "A"
                        ? "Grade A — Premium"
                        : `Grade ${selectedListing?.grade}`
                    }
                  />
                  <DetailRow
                    icon="scale"
                    label="Available"
                    value={`${Number(selectedListing?.quantity || 0).toLocaleString()} kg`}
                  />
                  <DetailRow
                    icon="payments"
                    label="Unit Price"
                    value={`KES ${getBuyerUnitPrice(selectedListing?.grade).toLocaleString()} / kg`}
                  />
                  <DetailRow
                    icon="calendar-today"
                    label="Harvest Date"
                    value={
                      selectedListing
                        ? new Date(
                            selectedListing.created_at,
                          ).toLocaleDateString()
                        : ""
                    }
                  />
                </View>

                {/* Editable Order Quantity Section */}
                <View className="mt-5">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-black text-[#2A5C43] uppercase text-xs tracking-wider">
                      Select Order Quantity (kg)
                    </Text>
                    <Text className="text-xs font-bold text-gray-500">
                      Max: {Number(selectedListing?.quantity || 0).toLocaleString()} kg
                    </Text>
                  </View>

                  {/* Preset Chips */}
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {[50, 100, 500, 1000].map((preset) => {
                      const isSelected = Number(quantity) === preset;
                      return (
                        <Pressable
                          key={preset}
                          onPress={() => setQuantity(String(preset))}
                          className={`px-3 py-2 rounded-xl border ${
                            isSelected
                              ? "bg-[#2A5C43] border-[#2A5C43]"
                              : "bg-[#F4FBF7] border-[#2A5C43]/20"
                          }`}
                        >
                          <Text
                            className={`text-xs font-black ${
                              isSelected ? "text-white" : "text-[#2A5C43]"
                            }`}
                          >
                            {preset} kg
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() =>
                        setQuantity(String(selectedListing?.quantity || ""))
                      }
                      className="px-3 py-2 rounded-xl border bg-[#F4FBF7] border-[#2A5C43]/20"
                    >
                      <Text className="text-xs font-black text-[#2A5C43]">Max</Text>
                    </Pressable>
                  </View>

                  {/* Quantity Input Box */}
                  <View className="bg-white border-2 border-[#2A5C43]/40 rounded-2xl px-4 py-3 flex-row items-center justify-between">
                    <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      placeholder="Enter quantity in kg"
                      style={{ outlineStyle: "none" } as never}
                      className="text-xl font-black text-gray-900 flex-1"
                    />
                    <Text className="text-sm font-black text-[#2A5C43] ml-2">kg</Text>
                  </View>
                </View>

                {/* Total Cost Breakdown */}
                <View className="bg-[#E7F5EE] rounded-2xl p-4 mt-4 border border-[#BDE3D0]">
                  <Text className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Total Order Payable
                  </Text>
                  <Text className="text-2xl font-black text-[#2A5C43]">
                    KES ${(
                      Number(quantity || 0) * getBuyerUnitPrice(selectedListing?.grade)
                    ).toLocaleString()}
                  </Text>
                  <Text className="text-xs text-[#2A5C43]/80 font-bold mt-1">
                    {Number(quantity || 0).toLocaleString()} kg @ KES {getBuyerUnitPrice(selectedListing?.grade)} / kg
                  </Text>
                </View>

                {/* Action Button */}
                <Pressable
                  onPress={() =>
                    selectedListing && createOrder(selectedListing)
                  }
                  disabled={creatingId === selectedListing?.id}
                  className={`mt-5 rounded-2xl py-4 items-center ${
                    creatingId === selectedListing?.id
                      ? "bg-[#53866f]"
                      : "bg-[#2A5C43]"
                  }`}
                >
                  <Text className="text-white font-black text-base">
                    {creatingId === selectedListing?.id
                      ? "Placing Order..."
                      : `Place Order — KES ${(
                          Number(quantity || 0) * getBuyerUnitPrice(selectedListing?.grade)
                        ).toLocaleString()}`}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedListing(null)}
                  className="mt-3 items-center py-3"
                >
                  <Text className="text-gray-500 font-bold">Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Full-screen photo modal */}
      <Modal visible={Boolean(photoModal)} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black items-center justify-center"
          onPress={() => setPhotoModal(null)}
        >
          {photoModal && (
            <Image
              source={{ uri: photoModal }}
              style={{ width: "100%", height: "100%" }}
              contentFit="contain"
            />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function InfoChip({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <View className="flex-1">
      <Text
        className="text-[10px] uppercase font-black"
        style={{ color: dark ? "#BDF264" : "#6b7280" }}
      >
        {label}
      </Text>
      <Text
        className="font-black mt-1 text-sm"
        style={{ color: dark ? "#ffffff" : "#1b1b1b" }}
      >
        {value}
      </Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <MaterialIcons name={icon} size={18} color="#2A5C43" />
      <View className="flex-1">
        <Text className="text-[10px] text-gray-500 font-black uppercase">
          {label}
        </Text>
        <Text className="text-gray-900 font-bold text-sm mt-0.5">{value}</Text>
      </View>
    </View>
  );
}
