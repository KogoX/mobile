import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerButton, ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const summary = [
  ["Total Farmers", "1,284", "+12% from last month", "#0f5238"],
  ["Pending Verification", "42", "Requires document review", "#d97706"],
  ["Suspended", "5", "View compliance issues", "#ba1a1a"],
]

const farmers = [
  ["SM", "Samuel Mwangi", "Added 12 Jan 2024", "KE-KM-8821", "Githunguri, Kiambu", "Verified", "12,450 kg", "View Details"],
  ["LW", "Lydia Wanjiku", "Added 02 Feb 2024", "KE-KM-8902", "Limuru, Kiambu", "Pending", "8,210 kg", "Review"],
  ["DK", "David Koech", "Added 28 Jan 2024", "KE-KM-7764", "Kikuyu, Kiambu", "Flagged", "5,430 kg", "View Issues"],
  ["PK", "Peter Kamau", "Added 15 Dec 2023", "KE-KM-5541", "Thika, Kiambu", "Suspended", "0 kg", "Reactivate"],
]

export default function ManagerFarmers() {
  const { width } = useWindowDimensions()
  const desktop = width >= 1000

  return (
    <ManagerLayout active="Farmers" title="Farmer Registry" subtitle="Manage and monitor the registered farmers in the Kiambu export sector." action={<ManagerButton icon="person-add" label="Add New Farmer" />}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.pageHead}>
          <View>
            <Text style={styles.bigTitle}>Farmer Registry</Text>
            <Text style={styles.bigSubtitle}>Manage and monitor the registered farmers in the Kiambu export sector.</Text>
          </View>
          <Text style={styles.season}>Export Season: 2024 Phase A</Text>
        </View>

        <View style={[styles.summaryGrid, desktop && styles.summaryGridDesktop]}>
          {summary.map(([label, value, hint, color], index) => (
            <View key={label} style={styles.summaryCard}>
              <Text style={styles.labelCaps}>{label}</Text>
              <Text style={[styles.summaryValue, { color }]}>{value}</Text>
              <View style={styles.summaryHintRow}>
                {index === 0 ? <MaterialIcons name="trending-up" size={16} color="#0f5238" /> : null}
                <Text style={[styles.summaryHint, index === 2 && styles.issueLink]}>{hint}</Text>
              </View>
              {index === 1 ? <MaterialIcons name="pending-actions" size={110} color="rgba(217,119,6,0.08)" style={styles.watermark} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.registry}>
          <View style={styles.filters}>
            <View style={styles.filterButton}>
              <MaterialIcons name="filter-list" size={19} color="#605f50" />
              <Text style={styles.filterText}>All Statuses</Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color="#605f50" />
            </View>
            <View style={styles.filterButton}>
              <MaterialIcons name="place" size={19} color="#605f50" />
              <Text style={styles.filterText}>All Regions</Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color="#605f50" />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={styles.nameHead}>Farmer Name</Text>
                <Text style={styles.colHead}>Farmer ID</Text>
                <Text style={styles.colHead}>Location</Text>
                <Text style={styles.statusHead}>Verification Status</Text>
                <Text style={styles.yieldHead}>Yield YTD (kg)</Text>
                <Text style={styles.actionHead}>Actions</Text>
              </View>
              {farmers.map(([initials, name, added, id, location, status, yieldKg, action]) => (
                <View key={id} style={[styles.row, status === "Suspended" && styles.dimRow]}>
                  <View style={styles.nameCell}>
                    <View style={[styles.avatar, status === "Suspended" && styles.avatarMuted]}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.farmerName}>{name}</Text>
                      <Text style={styles.added}>{added}</Text>
                    </View>
                  </View>
                  <Text style={styles.idCell}>{id}</Text>
                  <Text style={styles.locationCell}>{location}</Text>
                  <View style={[styles.badge, status === "Pending" && styles.pending, status === "Flagged" && styles.flagged, status === "Suspended" && styles.suspended]}>
                    <Text style={[styles.badgeText, status === "Flagged" && styles.flaggedText, status === "Suspended" && styles.suspendedText]}>{status}</Text>
                  </View>
                  <Text style={styles.yieldCell}>{yieldKg}</Text>
                  <View style={styles.actionCell}>
                    <Text style={styles.actionText}>{action}</Text>
                    <MaterialIcons name="edit" size={18} color="#a8a29e" />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.pagination}>
            <Text style={styles.pageMuted}>Previous</Text>
            <View style={styles.pages}>
              <Text style={styles.pageActive}>1</Text>
              <Text style={styles.page}>2</Text>
              <Text style={styles.page}>3</Text>
              <Text style={styles.ellipsis}>...</Text>
              <Text style={styles.page}>128</Text>
            </View>
            <Text style={styles.pageNext}>Next</Text>
          </View>
        </View>
        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}

const styles = StyleSheet.create({
  page: { padding: 32, backgroundColor: "#fcf9f8" },
  pageHead: { marginBottom: 64, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap" },
  bigTitle: { color: "#0f5238", fontSize: 48, fontWeight: "900", fontFamily: "serif" },
  bigSubtitle: { color: "#605f50", fontSize: 18, marginTop: 8 },
  season: { color: "#605f50", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  summaryGrid: { gap: 24, marginBottom: 64 },
  summaryGridDesktop: { flexDirection: "row" },
  summaryCard: { flex: 1, minHeight: 150, minWidth: 230, backgroundColor: "#ffffff", borderRadius: 16, padding: 24, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.06, shadowRadius: 16 },
  labelCaps: { color: "#605f50", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  summaryValue: { fontSize: 36, fontWeight: "900", marginTop: 8, fontFamily: "serif" },
  summaryHintRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  summaryHint: { color: "#0f5238", fontSize: 12, fontWeight: "900" },
  issueLink: { color: "#ba1a1a", textDecorationLine: "underline" },
  watermark: { position: "absolute", right: -10, top: -12 },
  registry: { backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 24 },
  filters: { padding: 24, borderBottomWidth: 1, borderBottomColor: "#f5f5f4", flexDirection: "row", gap: 16, flexWrap: "wrap" },
  filterButton: { height: 40, borderRadius: 8, borderWidth: 1, borderColor: "#e7e5e4", backgroundColor: "#fafaf9", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  filterText: { color: "#605f50", fontSize: 13, fontWeight: "800" },
  table: { minWidth: 980 },
  tableHead: { flexDirection: "row", backgroundColor: "rgba(250,250,249,0.65)", borderBottomWidth: 1, borderBottomColor: "#f5f5f4", paddingVertical: 16 },
  nameHead: { width: 250, paddingLeft: 32, color: "#605f50", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  colHead: { width: 150, color: "#605f50", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  statusHead: { width: 170, color: "#605f50", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  yieldHead: { width: 140, color: "#605f50", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  actionHead: { width: 160, color: "#605f50", fontSize: 12, fontWeight: "900", textTransform: "uppercase", textAlign: "right", paddingRight: 32 },
  row: { minHeight: 82, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#fafaf9" },
  dimRow: { opacity: 0.72 },
  nameCell: { width: 250, paddingLeft: 32, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: "#b1f0ce", alignItems: "center", justifyContent: "center" },
  avatarMuted: { backgroundColor: "#e7e5e4" },
  avatarText: { color: "#0f5238", fontSize: 12, fontWeight: "900" },
  farmerName: { color: "#064e3b", fontWeight: "900" },
  added: { color: "#605f50", fontSize: 12, marginTop: 2 },
  idCell: { width: 150, color: "#57534e", fontSize: 13, fontFamily: "monospace" },
  locationCell: { width: 150, color: "#605f50", fontSize: 13 },
  badge: { width: 116, borderRadius: 999, backgroundColor: "#b1f0ce", paddingVertical: 6, alignItems: "center" },
  pending: { backgroundColor: "#fef3c7" },
  flagged: { backgroundColor: "#ffedd5" },
  suspended: { backgroundColor: "#ffdad6" },
  badgeText: { color: "#0f5238", fontSize: 12, fontWeight: "900" },
  flaggedText: { color: "#c2410c" },
  suspendedText: { color: "#ba1a1a" },
  yieldCell: { width: 140, color: "#064e3b", fontWeight: "900" },
  actionCell: { width: 160, paddingRight: 32, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 12 },
  actionText: { color: "#0f5238", fontSize: 13, fontWeight: "900" },
  pagination: { paddingHorizontal: 32, paddingVertical: 24, borderTopWidth: 1, borderTopColor: "#f5f5f4", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  pageMuted: { color: "#a8a29e", borderWidth: 1, borderColor: "#e7e5e4", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  pageNext: { color: "#78716c", borderWidth: 1, borderColor: "#e7e5e4", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  pages: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageActive: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#0f5238", color: "#ffffff", textAlign: "center", paddingTop: 10, fontWeight: "900", overflow: "hidden" },
  page: { width: 40, height: 40, borderRadius: 8, color: "#57534e", textAlign: "center", paddingTop: 10, fontWeight: "800", overflow: "hidden" },
  ellipsis: { color: "#57534e", fontWeight: "800" },
})
