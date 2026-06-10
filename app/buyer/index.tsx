import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native"

const logo = require("../../assets/cemslogo.svg")

const listings = [
  {
    name: "Kiambu Fruit Co-op",
    region: "Kiambu, Central",
    grade: "Grade A",
    variety: "Hass",
    quantity: "12.0 Tons",
    harvest: "Next 4 Days",
    price: "$1,180",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Rift Valley Growers",
    region: "Eldoret, RV",
    grade: "Grade B",
    variety: "Fuerte",
    quantity: "28.5 Tons",
    harvest: "Immediate",
    price: "$950",
    image: "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Embu Highlands Co-op",
    region: "Embu, Eastern",
    grade: "Grade A",
    variety: "Hass",
    quantity: "18.2 Tons",
    harvest: "Next 10 Days",
    price: "$1,210",
    image: "https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=900&q=80",
  },
]

export default function BuyerMarketplace() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= 860

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <TopBar active="Marketplace" onOrders={() => router.push("/buyer/orders")} />

      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={[styles.pageTitle, !isWide && styles.pageTitleMobile]}>
            Available Avocado Listings
          </Text>
          <Text style={styles.pageLead}>
            Connect directly with Kenyan cooperatives. Premium Hass and Fuerte avocados ready for export.
          </Text>
        </View>

        <View style={[styles.filterPanel, isWide && styles.filterPanelWide]}>
          <FilterField label="Region" value="All Regions" />
          <FilterField label="Grade" value="Grade A Premium" />
          <FilterField label="Quantity" value="Min. 5 Tons" input />
          <FilterField label="Availability" value="Available Now" />
          <Pressable style={styles.filterButton}>
            <MaterialIcons name="filter-alt" size={19} color="#ffffff" />
            <Text style={styles.filterButtonText}>Apply Filters</Text>
          </Pressable>
        </View>

        <View style={[styles.feature, isWide && styles.featureWide]}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=1200&q=80" }}
            style={[styles.featureImage, isWide && styles.featureImageWide]}
            contentFit="cover"
          />
          <View style={styles.featureCopy}>
            <Text style={styles.featureBadge}>Featured Harvest</Text>
            <Text style={styles.featureTitle}>Mount Kenya Organic Cooperative</Text>
            <View style={styles.featureGrid}>
              <FeatureStat label="Grade" value="Grade A Premium Hass" />
              <FeatureStat label="Quantity" value="45.5 Metric Tons" />
              <FeatureStat label="Location" value="Nyeri, Central Kenya" />
              <FeatureStat label="Price" value="$1,250 / Ton" />
            </View>
            <Pressable style={styles.lightButton}>
              <Text style={styles.lightButtonText}>Place Order Now</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.listingGrid, isWide && styles.listingGridWide]}>
          {listings.map((item) => (
            <View key={item.name} style={styles.listingCard}>
              <View style={styles.listingImageWrap}>
                <Image source={{ uri: item.image }} style={styles.listingImage} contentFit="cover" />
                <View style={styles.varietyPill}>
                  <Text style={styles.varietyText}>{item.variety}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.locationLine}>
                      <MaterialIcons name="location-on" size={16} color="#707973" />
                      <Text style={styles.locationText}>{item.region}</Text>
                    </View>
                  </View>
                  <Text style={styles.gradeBadge}>{item.grade}</Text>
                </View>
                <InfoRow label="Available Quantity" value={item.quantity} />
                <InfoRow label="Harvest Date" value={item.harvest} />
                <InfoRow label="Price per Ton" value={item.price} strong />
                <Pressable style={styles.outlineButton}>
                  <Text style={styles.outlineButtonText}>Place Order</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

function TopBar({ active, onOrders }: { active: string; onOrders: () => void }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.brand}>
        <Image source={logo} style={styles.logo} contentFit="contain" />
        <Text style={styles.brandText}>CEMS</Text>
      </View>
      <View style={styles.navRow}>
        <Text style={styles.navActive}>{active}</Text>
        <Pressable onPress={onOrders}>
          <Text style={styles.navItem}>Orders</Text>
        </Pressable>
      </View>
    </View>
  )
}

function FilterField({ label, value, input }: { label: string; value: string; input?: boolean }) {
  return (
    <View style={styles.filterField}>
      <Text style={styles.label}>{label}</Text>
      {input ? (
        <TextInput style={styles.selectBox} placeholder={value} placeholderTextColor="#605f50" />
      ) : (
        <View style={styles.selectBox}>
          <Text style={styles.selectText}>{value}</Text>
          <MaterialIcons name="expand-more" size={20} color="#707973" />
        </View>
      )}
    </View>
  )
}

function FeatureStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.featureStat}>
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureValue}>{value}</Text>
    </View>
  )
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, strong && styles.primaryText]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fcf9f8" },
  pageContent: { paddingBottom: 44 },
  topBar: {
    minHeight: 72,
    paddingHorizontal: 22,
    borderBottomColor: "#dcebe2",
    borderBottomWidth: 1,
    backgroundColor: "#fcf9f8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 22, height: 22 },
  brandText: { color: "#0f5238", fontSize: 22, fontWeight: "900" },
  navRow: { flexDirection: "row", gap: 20, alignItems: "center" },
  navActive: { color: "#0f5238", fontWeight: "900", textDecorationLine: "underline" },
  navItem: { color: "#605f50", fontWeight: "800" },
  container: { width: "100%", maxWidth: 1160, alignSelf: "center", padding: 20, gap: 24 },
  headerBlock: { marginTop: 16 },
  pageTitle: { color: "#0f5238", fontSize: 44, lineHeight: 52, fontWeight: "900" },
  pageTitleMobile: { fontSize: 34, lineHeight: 41 },
  pageLead: { color: "#404943", fontSize: 17, lineHeight: 27, maxWidth: 700, marginTop: 8 },
  filterPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#e0eee5",
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  filterPanelWide: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" },
  filterField: { flex: 1, minWidth: 150 },
  label: { color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginBottom: 8 },
  selectBox: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#f6f3f2",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#1b1b1b",
  },
  selectText: { color: "#1b1b1b", fontWeight: "700" },
  filterButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#0f5238",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  filterButtonText: { color: "#ffffff", fontWeight: "900" },
  feature: { backgroundColor: "#2d6a4f", borderRadius: 18, overflow: "hidden" },
  featureWide: { flexDirection: "row" },
  featureImage: { width: "100%", height: 250 },
  featureImageWide: { width: "48%", height: "auto", minHeight: 360 },
  featureCopy: { flex: 1, padding: 28, justifyContent: "center" },
  featureBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#a3e635",
    color: "#0f5238",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  featureTitle: { color: "#b1f0ce", fontSize: 32, lineHeight: 39, fontWeight: "900", marginBottom: 20 },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 26 },
  featureStat: { width: "45%" },
  featureLabel: { color: "#a3e635", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  featureValue: { color: "#ffffff", fontSize: 15, fontWeight: "800", marginTop: 4 },
  lightButton: { alignSelf: "flex-start", backgroundColor: "#ffffff", borderRadius: 999, paddingHorizontal: 22, paddingVertical: 13 },
  lightButtonText: { color: "#0f5238", fontWeight: "900" },
  listingGrid: { gap: 18 },
  listingGridWide: { flexDirection: "row", flexWrap: "wrap" },
  listingCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: "#ffffff",
    borderColor: "#e0eee5",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  listingImageWrap: { height: 190 },
  listingImage: { width: "100%", height: "100%" },
  varietyPill: { position: "absolute", top: 14, right: 14, backgroundColor: "#ffffff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  varietyText: { color: "#0f5238", fontWeight: "900" },
  cardBody: { padding: 18 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  flexOne: { flex: 1 },
  cardTitle: { color: "#0f5238", fontSize: 20, fontWeight: "900", marginBottom: 5 },
  locationLine: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { color: "#707973", fontSize: 13 },
  gradeBadge: { color: "#005236", backgroundColor: "#a0f4c8", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 10, fontWeight: "900" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, gap: 12 },
  infoLabel: { color: "#707973" },
  infoValue: { color: "#1b1b1b", fontWeight: "800" },
  primaryText: { color: "#0f5238" },
  outlineButton: { borderColor: "#0f5238", borderWidth: 2, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  outlineButtonText: { color: "#0f5238", fontWeight: "900" },
})
