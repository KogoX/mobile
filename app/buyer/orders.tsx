import { MaterialIcons } from "@expo/vector-icons"
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

const orders = [
  ["#ORD-7721", "Processing", "Mount Kenya Organic", "Grade A Hass Avocados", "20.5 Tons", "$25,625.00", "Oct 24, 2024"],
  ["#ORD-7690", "In Transit", "Aberdare Highlands", "Premium Jumbo Fuerte", "15.2 Tons", "$18,440.00", "Oct 20, 2024"],
  ["#ORD-7512", "Delivered", "Murang'a Growers", "Export Grade Hass", "32.0 Tons", "$41,000.00", "Oct 12, 2024"],
  ["#ORD-7405", "Cancelled", "Rift Valley Orchards", "Grade B Hass", "10.0 Tons", "$12,000.00", "Sep 28, 2024"],
] as const

const statusColors: Record<string, { bg: string; fg: string; dot: string }> = {
  Processing: { bg: "#fef3c7", fg: "#92400e", dot: "#d97706" },
  "In Transit": { bg: "#dbeafe", fg: "#1e40af", dot: "#2563eb" },
  Delivered: { bg: "#dcfce7", fg: "#166534", dot: "#16a34a" },
  Cancelled: { bg: "#fee2e2", fg: "#991b1b", dot: "#dc2626" },
}

export default function BuyerOrders() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= 780

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#2d6a4f" />
          </Pressable>
          <Text style={styles.headerTitle}>Order History</Text>
        </View>
        <MaterialIcons name="filter-list" size={24} color="#2d6a4f" />
      </View>

      <View style={styles.container}>
        <View style={[styles.searchPanel, isWide && styles.searchPanelWide]}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={22} color="#707973" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Order ID or Cooperative..."
              placeholderTextColor="#707973"
            />
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>All Dates</Text>
            <MaterialIcons name="expand-more" size={22} color="#707973" />
          </View>
        </View>

        <View style={styles.orderList}>
          {orders.map(([id, status, coop, produce, quantity, amount, date]) => (
            <View key={id} style={styles.orderCard}>
              <View style={[styles.orderTop, isWide && styles.orderTopWide]}>
                <View>
                  <Text style={styles.label}>Order ID</Text>
                  <Text style={styles.orderId}>{id}</Text>
                </View>
                <StatusBadge status={status} />
              </View>

              <View style={[styles.detailGrid, isWide && styles.detailGridWide]}>
                <Detail label="Cooperative" value={coop} strong />
                <Detail label="Produce Type" value={produce} />
                <Detail label="Quantity" value={quantity} />
                <Detail label="Total Amount" value={amount} amount />
                <Detail label="Order Date" value={date} />
              </View>

              <View style={styles.actions}>
                {status !== "Delivered" && status !== "Cancelled" ? (
                  <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryText}>Track Order</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.outlineButton}>
                  <Text style={styles.outlineText}>{status === "Cancelled" ? "Re-order" : "View Details"}</Text>
                </Pressable>
                <Pressable style={styles.textButton}>
                  <MaterialIcons name="description" size={18} color="#707973" />
                  <Text style={styles.textButtonLabel}>Invoice</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status]
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.statusText, { color: colors.fg }]}>{status}</Text>
    </View>
  )
}

function Detail({ label, value, strong, amount }: { label: string; value: string; strong?: boolean; amount?: boolean }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.detailValue, strong && styles.strongValue, amount && styles.amountValue]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fcf9f8" },
  content: { paddingBottom: 32 },
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    borderBottomColor: "#e9ede9",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fcf9f8",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#2d6a4f", fontSize: 20, fontWeight: "900" },
  container: { width: "100%", maxWidth: 980, alignSelf: "center", padding: 20, gap: 20 },
  searchPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  searchPanelWide: { flexDirection: "row", alignItems: "center" },
  searchBox: {
    flex: 2,
    minHeight: 50,
    borderColor: "#bfc9c1",
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: "#1b1b1b", outlineStyle: "none" as never },
  dateBox: {
    flex: 1,
    minHeight: 50,
    borderColor: "#bfc9c1",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: { color: "#404943", fontWeight: "800" },
  orderList: { gap: 16 },
  orderCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e9ede9",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  orderTop: { gap: 12, borderBottomColor: "#e9ede9", borderBottomWidth: 1, paddingBottom: 14, marginBottom: 16 },
  orderTopWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginBottom: 4 },
  orderId: { color: "#0f5238", fontSize: 20, fontWeight: "900" },
  statusBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "900" },
  detailGrid: { gap: 14, marginBottom: 16 },
  detailGridWide: { flexDirection: "row", flexWrap: "wrap" },
  detail: { minWidth: 180, flex: 1 },
  detailValue: { color: "#1b1b1b", fontSize: 15 },
  strongValue: { fontWeight: "900" },
  amountValue: { color: "#0f5238", fontSize: 19, fontWeight: "900" },
  actions: { borderTopColor: "#e9ede9", borderTopWidth: 1, paddingTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  primaryButton: { backgroundColor: "#0f5238", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  primaryText: { color: "#ffffff", fontWeight: "900" },
  outlineButton: { borderColor: "#0f5238", borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 },
  outlineText: { color: "#0f5238", fontWeight: "900" },
  textButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  textButtonLabel: { color: "#707973", fontWeight: "900" },
})
