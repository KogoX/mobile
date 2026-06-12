import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerButton, ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const metrics = [
  ["Total Farmers", "1,284", "+12% from last month", "trending-up"],
  ["Yield Aggregated", "42.8 MT", "Grade A Quality", "verified"],
  ["Active Orders", "156", "98 scheduled for pickup", "schedule"],
  ["Pending Approvals", "18", "Requires attention today", "priority-high"],
]

const farmers = [
  ["SM", "Samuel Mwangi", "KE-KM-8821", "1,420", "DISBURSED"],
  ["JN", "Jane Njeri", "KE-KM-5510", "890", "PENDING"],
  ["EO", "Emmanuel Otieno", "KE-KM-1204", "2,110", "DISBURSED"],
  ["MW", "Mary Wanjiku", "KE-KM-3392", "540", "FLAGGED"],
]

const approvals = [
  ["#EXP-7721", "Premium Hass Batch", "850 KG", "Limuru", "LEVEL 2"],
  ["#EXP-7724", "Standard Fuerte Batch", "1,200 KG", "Gatundu", "LEVEL 1"],
]

export default function ManagerDashboard() {
  const { width } = useWindowDimensions()
  const desktop = width >= 1180

  return (
    <ManagerLayout
      active="Dashboard"
      title="Operational Overview"
      subtitle="Harvest Season 2024 - Phase 2"
      action={<ManagerButton label="Generate Export Log" />}
    >
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.metricGrid, desktop && styles.metricGridDesktop]}>
          {metrics.map(([label, value, hint, icon], index) => (
            <View key={label} style={[styles.metricCard, index === 3 && styles.metricAccent]}>
              <Text style={styles.labelCaps}>{label}</Text>
              <Text style={styles.metricValue}>{value}</Text>
              <View style={styles.metricHintRow}>
                <MaterialIcons name={icon as never} size={14} color={index === 2 ? "#404943" : "#0f5238"} />
                <Text style={[styles.metricHint, index === 2 && styles.mutedHint]}>{hint}</Text>
              </View>
              <View style={styles.leafMark}>
                <MaterialIcons name="eco" size={74} color="#2d6a4f" />
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.grid, desktop && styles.gridDesktop]}>
          <View style={styles.activityCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Farmer Activity List</Text>
              <View style={styles.searchRow}>
                <View style={styles.searchPill}>
                  <MaterialIcons name="search" size={17} color="#404943" />
                  <Text style={styles.searchText}>Search farmers...</Text>
                </View>
                <View style={styles.iconOnly}>
                  <MaterialIcons name="filter-list" size={20} color="#404943" />
                </View>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                <View style={styles.tableHead}>
                  <Text style={styles.nameCol}>Farmer Name</Text>
                  <Text style={styles.idCol}>Farmer ID</Text>
                  <Text style={styles.yieldCol}>Yield (KG)</Text>
                  <Text style={styles.statusCol}>Payment Status</Text>
                  <Text style={styles.actionCol}>Actions</Text>
                </View>
                {farmers.map(([initials, name, id, yieldKg, status]) => (
                  <View key={id} style={styles.row}>
                    <View style={styles.nameCol}>
                      <View style={[styles.avatar, initials === "JN" && styles.avatarSand]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                      <Text style={styles.farmerName}>{name}</Text>
                    </View>
                    <Text style={styles.idColText}>{id}</Text>
                    <Text style={styles.yieldColText}>{yieldKg}</Text>
                    <View style={[styles.statusPill, status === "PENDING" && styles.pending, status === "FLAGGED" && styles.flagged]}>
                      <Text style={[styles.statusText, status === "FLAGGED" && styles.flaggedText]}>{status}</Text>
                    </View>
                    <Text style={styles.actionText}>View Details</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.queue}>
            <Text style={styles.sectionTitle}>Approval Queue</Text>
            {approvals.map(([order, batch, weight, origin, level]) => (
              <View key={order} style={styles.approvalCard}>
                <View style={styles.approvalTop}>
                  <View>
                    <Text style={styles.labelCaps}>Order {order}</Text>
                    <Text style={styles.approvalTitle}>{batch}</Text>
                  </View>
                  <Text style={styles.level}>{level}</Text>
                </View>
                <View style={styles.approvalStats}>
                  <View>
                    <Text style={styles.tinyLabel}>Weight</Text>
                    <Text style={styles.approvalValue}>{weight}</Text>
                  </View>
                  <View>
                    <Text style={styles.tinyLabel}>Origin</Text>
                    <Text style={styles.approvalValue}>{origin}</Text>
                  </View>
                </View>
                <View style={styles.approvalActions}>
                  <Text style={styles.approve}>Approve</Text>
                  <Text style={styles.reject}>Reject</Text>
                </View>
              </View>
            ))}
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <MaterialIcons name="lightbulb" size={24} color="#98ebc0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Optimization Tip</Text>
                <Text style={styles.tipText}>Aggregating orders from Limuru could reduce logistics costs by 14%.</Text>
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
  metricGrid: { gap: 24 },
  metricGridDesktop: { flexDirection: "row" },
  metricCard: {
    flex: 1,
    minWidth: 220,
    minHeight: 150,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  metricAccent: { borderLeftWidth: 4, borderLeftColor: "#0f5238" },
  labelCaps: { color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  metricValue: { color: "#0f5238", fontSize: 36, fontWeight: "900", marginTop: 10, fontFamily: "serif" },
  metricHintRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  metricHint: { color: "#0f5238", fontSize: 13, fontWeight: "800" },
  mutedHint: { color: "#404943" },
  leafMark: { position: "absolute", right: -18, bottom: -24, opacity: 0.05 },
  grid: { marginTop: 64, gap: 24 },
  gridDesktop: { flexDirection: "row", alignItems: "flex-start" },
  activityCard: { flex: 2, backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.06, shadowRadius: 16 },
  cardHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: "#eae7e7", flexDirection: "row", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" },
  sectionTitle: { color: "#0f5238", fontSize: 22, fontWeight: "900", fontFamily: "serif" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  searchPill: { height: 38, minWidth: 210, borderRadius: 999, paddingHorizontal: 14, backgroundColor: "#f6f3f2", borderWidth: 1, borderColor: "#eae7e7", flexDirection: "row", alignItems: "center", gap: 8 },
  searchText: { color: "#707973", fontSize: 13 },
  iconOnly: { width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  table: { minWidth: 760 },
  tableHead: { flexDirection: "row", backgroundColor: "#f6f3f2", paddingVertical: 16, paddingHorizontal: 24 },
  row: { minHeight: 70, flexDirection: "row", alignItems: "center", paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: "#eae7e7" },
  nameCol: { width: 220, flexDirection: "row", alignItems: "center", gap: 12, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  idCol: { width: 150, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  yieldCol: { width: 120, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  statusCol: { width: 170, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  actionCol: { width: 100, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  avatar: { width: 32, height: 32, borderRadius: 999, backgroundColor: "#b1f0ce", alignItems: "center", justifyContent: "center" },
  avatarSand: { backgroundColor: "#e6e3d0" },
  avatarText: { color: "#0e5138", fontSize: 12, fontWeight: "900" },
  farmerName: { color: "#0f5238", fontWeight: "900" },
  idColText: { width: 150, color: "#404943", fontSize: 13, fontFamily: "monospace" },
  yieldColText: { width: 120, color: "#1b1b1b", fontWeight: "900" },
  statusPill: { width: 132, borderRadius: 999, backgroundColor: "#a0f4c8", alignItems: "center", paddingVertical: 6 },
  pending: { backgroundColor: "#e5e2e1" },
  flagged: { backgroundColor: "#ffdad6" },
  statusText: { color: "#005236", fontSize: 11, fontWeight: "900" },
  flaggedText: { color: "#93000a" },
  actionText: { width: 100, color: "#0f5238", fontSize: 13, fontWeight: "900" },
  queue: { flex: 1, gap: 24 },
  approvalCard: { backgroundColor: "#ffffff", borderRadius: 12, padding: 24, borderWidth: 1, borderColor: "#eae7e7", shadowColor: "#2d6a4f", shadowOpacity: 0.06, shadowRadius: 16 },
  approvalTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  approvalTitle: { color: "#0f5238", fontSize: 18, fontWeight: "900", marginTop: 4 },
  level: { color: "#404943", backgroundColor: "#f0eded", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, fontSize: 10, fontWeight: "900", overflow: "hidden" },
  approvalStats: { marginTop: 16, marginBottom: 16, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#f6f3f2", flexDirection: "row", gap: 32 },
  tinyLabel: { color: "#404943", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  approvalValue: { color: "#0f5238", fontWeight: "900", marginTop: 4 },
  approvalActions: { flexDirection: "row", gap: 16 },
  approve: { flex: 1, textAlign: "center", backgroundColor: "#0f5238", color: "#ffffff", borderRadius: 999, paddingVertical: 10, fontWeight: "900", overflow: "hidden" },
  reject: { flex: 1, textAlign: "center", borderWidth: 1, borderColor: "#ba1a1a", color: "#ba1a1a", borderRadius: 999, paddingVertical: 9, fontWeight: "900", overflow: "hidden" },
  tipCard: { backgroundColor: "rgba(16,109,75,0.1)", borderColor: "rgba(16,109,75,0.3)", borderWidth: 1, borderRadius: 12, padding: 24, flexDirection: "row", gap: 24, alignItems: "center" },
  tipIcon: { width: 48, height: 48, borderRadius: 999, backgroundColor: "#106d4b", alignItems: "center", justifyContent: "center" },
  tipTitle: { color: "#005337", fontWeight: "900" },
  tipText: { color: "#005236", fontSize: 12, marginTop: 4, lineHeight: 18 },
})
