import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const metrics = [
  ["Total Farmers", "1,284", "+12% from last month"],
  ["Yield Aggregated", "42.8 MT", "Grade A Quality"],
  ["Active Orders", "156", "94 scheduled for pickup"],
  ["Pending Approvals", "18", "Requires attention today"],
]

const farmers = [
  ["Samuel Mwangi", "KE-AV-9824", "1,420", "DISBURSED"],
  ["Jane Njeri", "KE-AV-6518", "890", "PENDING"],
  ["Emmanuel Otieno", "KE-AV-1234", "2,110", "DISBURSED"],
  ["Mary Wanjiku", "KE-AV-3292", "540", "FLAGGED"],
]

const approvals = [
  ["#EXP-7721", "Premium Hass Batch", "850 KG", "Limuru", "LEVEL 2"],
  ["#EXP-7724", "Standard Fuerte Batch", "1,200 KG", "Gatundu", "LEVEL 1"],
]

export default function ManagerDashboard() {
  const { width } = useWindowDimensions()
  const desktop = width >= 980

  return (
    <ManagerLayout active="Dashboard">
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Operational Overview</Text>
            <Text style={styles.subtitle}>Harvest Season 2024 - Phase 2</Text>
          </View>
          <View style={styles.exportButton}>
            <MaterialIcons name="download" size={18} color="#ffffff" />
            <Text style={styles.exportText}>Generate Export Log</Text>
          </View>
        </View>

        <View style={[styles.metricGrid, desktop && styles.metricGridDesktop]}>
          {metrics.map(([label, value, hint], index) => (
            <View key={label} style={[styles.metricCard, index === 3 && styles.metricAccent]}>
              <Text style={styles.metricLabel}>{label}</Text>
              <Text style={styles.metricValue}>{value}</Text>
              <Text style={styles.metricHint}>{hint}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.contentGrid, desktop && styles.contentGridDesktop]}>
          <View style={styles.panel}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>Farmer Activity List</Text>
              <View style={styles.search}>
                <MaterialIcons name="search" size={16} color="#7a827d" />
                <Text style={styles.searchText}>Search Farmers...</Text>
              </View>
            </View>
            <View style={styles.tableHead}>
              <Text style={styles.cellName}>Farmer Name</Text>
              <Text style={styles.cell}>Farmer ID</Text>
              <Text style={styles.cell}>Yield (KG)</Text>
              <Text style={styles.cell}>Payment Status</Text>
              <Text style={styles.cellAction}>Action</Text>
            </View>
            {farmers.map(([name, id, yieldKg, status]) => (
              <View key={id} style={styles.tableRow}>
                <View style={styles.nameCell}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.rowStrong}>{name}</Text>
                </View>
                <Text style={styles.cell}>{id}</Text>
                <Text style={styles.cell}>{yieldKg}</Text>
                <View style={[styles.status, status === "FLAGGED" && styles.statusBad, status === "PENDING" && styles.statusPending]}>
                  <Text style={[styles.statusText, status === "FLAGGED" && styles.statusTextBad]}>{status}</Text>
                </View>
                <Text style={styles.link}>View Details</Text>
              </View>
            ))}
          </View>

          <View style={styles.sideStack}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Approval Queue</Text>
              {approvals.map(([order, batch, weight, region, level]) => (
                <View key={order} style={styles.approval}>
                  <View style={styles.approvalTop}>
                    <Text style={styles.orderId}>Order {order}</Text>
                    <Text style={styles.level}>{level}</Text>
                  </View>
                  <Text style={styles.batch}>{batch}</Text>
                  <Text style={styles.meta}>{weight} - {region}</Text>
                  <View style={styles.actionRow}>
                    <Text style={styles.approve}>Approve</Text>
                    <Text style={styles.reject}>Reject</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.tip}>
              <View style={styles.pin}>
                <MaterialIcons name="location-on" size={22} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Optimization Tip</Text>
                <Text style={styles.tipText}>Aggregating orders from Limuru could reduce logistics costs by 18%.</Text>
              </View>
            </View>
          </View>
        </View>

        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}

const styles = StyleSheet.create({
  page: { padding: 32, backgroundColor: "#fcf9f8" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { color: "#163c2d", fontSize: 28, fontWeight: "900" },
  subtitle: { color: "#66736d", marginTop: 4, fontWeight: "700" },
  exportButton: { backgroundColor: "#07543b", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  exportText: { color: "#ffffff", fontWeight: "900" },
  metricGrid: { gap: 16, marginTop: 28 },
  metricGridDesktop: { flexDirection: "row" },
  metricCard: { flex: 1, minWidth: 190, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22 },
  metricAccent: { borderLeftColor: "#0f5238", borderLeftWidth: 5 },
  metricLabel: { color: "#354b40", fontWeight: "900" },
  metricValue: { color: "#07543b", fontSize: 29, fontWeight: "900", marginTop: 12 },
  metricHint: { color: "#5e8e74", marginTop: 8, fontWeight: "700" },
  contentGrid: { gap: 20, marginTop: 30 },
  contentGridDesktop: { flexDirection: "row", alignItems: "flex-start" },
  panel: { backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22, flex: 1 },
  panelHead: { flexDirection: "row", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" },
  panelTitle: { color: "#163c2d", fontSize: 20, fontWeight: "900" },
  search: { minWidth: 190, backgroundColor: "#f5f3f1", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", gap: 8, alignItems: "center" },
  searchText: { color: "#7a827d", fontWeight: "700" },
  tableHead: { marginTop: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ebe6e4", flexDirection: "row", gap: 12 },
  tableRow: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: "#f0ecea", flexDirection: "row", alignItems: "center", gap: 12 },
  cellName: { flex: 2, color: "#163c2d", fontSize: 12, fontWeight: "900" },
  cell: { flex: 1, color: "#263b31", fontSize: 12, fontWeight: "800" },
  cellAction: { width: 80, color: "#163c2d", fontSize: 12, fontWeight: "900" },
  nameCell: { flex: 2, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 999, backgroundColor: "#d8f6e5", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#07543b", fontSize: 10, fontWeight: "900" },
  rowStrong: { color: "#163c2d", fontWeight: "900", flexShrink: 1 },
  status: { flex: 1, backgroundColor: "#d5f8df", borderRadius: 999, alignItems: "center", paddingVertical: 5 },
  statusPending: { backgroundColor: "#f1eee8" },
  statusBad: { backgroundColor: "#ffe4e2" },
  statusText: { color: "#07543b", fontSize: 10, fontWeight: "900" },
  statusTextBad: { color: "#ba1a1a" },
  link: { width: 80, color: "#07543b", fontSize: 12, fontWeight: "900" },
  sideStack: { flex: 0.8, gap: 18 },
  approval: { marginTop: 18, padding: 18, borderRadius: 8, backgroundColor: "#fbfaf9", borderWidth: 1, borderColor: "#ebe6e4" },
  approvalTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  orderId: { color: "#163c2d", fontWeight: "900" },
  level: { color: "#605f50", backgroundColor: "#f3f1ee", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, fontSize: 10, fontWeight: "900" },
  batch: { color: "#07543b", fontSize: 16, fontWeight: "900", marginTop: 10 },
  meta: { color: "#4f665b", marginTop: 8, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  approve: { backgroundColor: "#07543b", color: "#ffffff", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8, fontWeight: "900", overflow: "hidden" },
  reject: { borderWidth: 1, borderColor: "#f0a8a2", color: "#ba1a1a", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8, fontWeight: "900", overflow: "hidden" },
  tip: { borderRadius: 8, backgroundColor: "#dff3e8", padding: 20, flexDirection: "row", gap: 14, alignItems: "center" },
  pin: { width: 48, height: 48, borderRadius: 999, backgroundColor: "#0f8a5f", alignItems: "center", justifyContent: "center" },
  tipTitle: { color: "#07543b", fontSize: 16, fontWeight: "900" },
  tipText: { color: "#4b675a", marginTop: 4, fontWeight: "700" },
})
