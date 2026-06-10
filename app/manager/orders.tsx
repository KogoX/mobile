import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native"
import { ManagerTop, Sidebar } from "./index"

const orders = [
  ["#EXP-7721", "Premium Hass Batch", "Limuru", "850 KG", "Level 2", "Awaiting Approval"],
  ["#EXP-7724", "Standard Fuerte Batch", "Gatundu", "1,200 KG", "Level 1", "Awaiting Approval"],
  ["#EXP-7698", "Organic Hass Batch", "Kiambaa", "2,450 KG", "Level 3", "Scheduled Pickup"],
  ["#EXP-7655", "Mixed Grade Batch", "Thika", "1,640 KG", "Level 1", "In Quality Check"],
] as const

export default function ManagerOrders() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 920

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ManagerTop active="Orders" onDashboard={() => router.push("/manager")} onOrders={() => router.push("/manager/orders")} onPayouts={() => router.push("/manager/payouts")} />
      <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
        <Sidebar active="Orders" isDesktop={isDesktop} onDashboard={() => router.push("/manager")} onOrders={() => router.push("/manager/orders")} onPayouts={() => router.push("/manager/payouts")} />
        <View style={styles.main}>
          <View style={[styles.header, isDesktop && styles.headerWide]}>
            <View>
              <Text style={styles.title}>Export Orders</Text>
              <Text style={styles.subtitle}>Approve, schedule, and monitor cooperative export batches</Text>
            </View>
            <Pressable style={styles.primaryButton}>
              <MaterialIcons name="add" size={20} color="#ffffff" />
              <Text style={styles.primaryText}>Create Batch</Text>
            </Pressable>
          </View>

          <View style={[styles.filterCard, isDesktop && styles.filterCardWide]}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color="#707973" />
              <TextInput style={styles.searchInput} placeholder="Search by order, origin, or batch..." placeholderTextColor="#707973" />
            </View>
            <Chip label="All Statuses" />
            <Chip label="This Week" />
          </View>

          <View style={[styles.summaryGrid, isDesktop && styles.summaryGridWide]}>
            <Summary label="Pending Approval" value="18" />
            <Summary label="Scheduled Pickup" value="98" />
            <Summary label="Quality Checks" value="34" />
            <Summary label="Ready to Export" value="56" />
          </View>

          <View style={styles.orderList}>
            {orders.map(([id, batch, origin, weight, level, status]) => (
              <View key={id} style={[styles.orderCard, isDesktop && styles.orderCardWide]}>
                <View style={styles.orderMain}>
                  <Text style={styles.orderId}>{id}</Text>
                  <Text style={styles.orderTitle}>{batch}</Text>
                  <View style={styles.metaRow}>
                    <Meta icon="location-on" value={origin} />
                    <Meta icon="scale" value={weight} />
                    <Meta icon="workspace-premium" value={level} />
                  </View>
                </View>
                <Status status={status} />
                <View style={styles.actions}>
                  <Pressable style={styles.approveButton}><Text style={styles.approveText}>Approve</Text></Pressable>
                  <Pressable style={styles.outlineButton}><Text style={styles.outlineText}>Inspect</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

function Chip({ label }: { label: string }) {
  return <View style={styles.chip}><Text style={styles.chipText}>{label}</Text><MaterialIcons name="expand-more" size={18} color="#707973" /></View>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <View style={styles.summary}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>
}

function Meta({ icon, value }: { icon: keyof typeof MaterialIcons.glyphMap; value: string }) {
  return <View style={styles.meta}><MaterialIcons name={icon} size={16} color="#707973" /><Text style={styles.metaText}>{value}</Text></View>
}

function Status({ status }: { status: string }) {
  const ready = status === "Scheduled Pickup"
  return <Text style={[styles.status, ready ? styles.statusReady : styles.statusPending]}>{status}</Text>
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fcf9f8" },
  content: { paddingBottom: 36 },
  shell: { width: "100%", maxWidth: 1280, alignSelf: "center" },
  shellDesktop: { flexDirection: "row", alignItems: "stretch" },
  main: { flex: 1, padding: 20, gap: 20 },
  header: { gap: 14 },
  headerWide: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#0f5238", fontSize: 34, lineHeight: 41, fontWeight: "900" },
  subtitle: { color: "#707973", fontSize: 14, lineHeight: 22, marginTop: 4 },
  primaryButton: { alignSelf: "flex-start", backgroundColor: "#0f5238", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  primaryText: { color: "#ffffff", fontWeight: "900" },
  filterCard: { backgroundColor: "#ffffff", borderColor: "#e0eee5", borderWidth: 1, borderRadius: 16, padding: 14, gap: 12, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  filterCardWide: { flexDirection: "row", alignItems: "center" },
  searchBox: { flex: 1, minHeight: 46, borderColor: "#e5e2e1", borderWidth: 1, borderRadius: 999, backgroundColor: "#f6f3f2", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: "#1b1b1b", outlineStyle: "none" as never },
  chip: { minHeight: 46, borderColor: "#e5e2e1", borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  chipText: { color: "#404943", fontWeight: "800" },
  summaryGrid: { gap: 12 },
  summaryGridWide: { flexDirection: "row" },
  summary: { flex: 1, backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 16 },
  summaryLabel: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  summaryValue: { color: "#0f5238", fontSize: 30, fontWeight: "900", marginTop: 8 },
  orderList: { gap: 14 },
  orderCard: { backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 18, gap: 14, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  orderCardWide: { flexDirection: "row", alignItems: "center" },
  orderMain: { flex: 1 },
  orderId: { color: "#707973", fontSize: 12, fontWeight: "900" },
  orderTitle: { color: "#0f5238", fontSize: 20, fontWeight: "900", marginTop: 3, marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#404943", fontWeight: "700" },
  status: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, fontSize: 12, fontWeight: "900" },
  statusReady: { backgroundColor: "#a0f4c8", color: "#005236" },
  statusPending: { backgroundColor: "#e6e3d0", color: "#48473a" },
  actions: { flexDirection: "row", gap: 10 },
  approveButton: { backgroundColor: "#0f5238", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  approveText: { color: "#ffffff", fontWeight: "900" },
  outlineButton: { borderColor: "#0f5238", borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  outlineText: { color: "#0f5238", fontWeight: "900" },
})
