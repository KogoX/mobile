import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const stats = [
  ["Registered Farmers", "1,284", "Across Kiambu and Murang'a"],
  ["Verified Farms", "1,139", "88.7% compliance"],
  ["Pending Review", "42", "Awaiting document checks"],
  ["Flagged Accounts", "5", "Require manager action"],
]

const rows = [
  ["Samuel Mwangi", "KE-AV-9824", "Limuru", "4.5 acres", "Verified", "1,420 KG"],
  ["Jane Njeri", "KE-AV-6518", "Gatundu", "2.8 acres", "Pending", "890 KG"],
  ["Emmanuel Otieno", "KE-AV-1234", "Ruiru", "6.1 acres", "Verified", "2,110 KG"],
  ["Mary Wanjiku", "KE-AV-3292", "Kikuyu", "1.9 acres", "Flagged", "540 KG"],
]

export default function ManagerFarmers() {
  const { width } = useWindowDimensions()
  const desktop = width >= 980

  return (
    <ManagerLayout active="Farmers">
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Farmer Registry</Text>
            <Text style={styles.subtitle}>Manage farmer profiles, farm verification, and production readiness.</Text>
          </View>
          <View style={styles.primary}>
            <MaterialIcons name="person-add" size={18} color="#ffffff" />
            <Text style={styles.primaryText}>Add Farmer</Text>
          </View>
        </View>

        <View style={[styles.stats, desktop && styles.statsDesktop]}>
          {stats.map(([label, value, hint]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statHint}>{hint}</Text>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Farmers</Text>
            <View style={styles.filters}>
              <View style={styles.search}>
                <MaterialIcons name="search" size={16} color="#6f7973" />
                <Text style={styles.placeholder}>Search farmer, ID, location...</Text>
              </View>
              <View style={styles.filterButton}>
                <MaterialIcons name="filter-list" size={18} color="#07543b" />
              </View>
            </View>
          </View>

          <View style={styles.tableHead}>
            <Text style={styles.nameCol}>Farmer</Text>
            <Text style={styles.col}>Location</Text>
            <Text style={styles.col}>Farm Size</Text>
            <Text style={styles.col}>Status</Text>
            <Text style={styles.col}>Yield</Text>
          </View>

          {rows.map(([name, id, location, farmSize, status, yieldKg]) => (
            <View key={id} style={styles.tableRow}>
              <View style={styles.nameCol}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{name}</Text>
                  <Text style={styles.rowMeta}>{id}</Text>
                </View>
              </View>
              <Text style={styles.col}>{location}</Text>
              <Text style={styles.col}>{farmSize}</Text>
              <View style={[styles.badge, status === "Pending" && styles.pending, status === "Flagged" && styles.flagged]}>
                <Text style={[styles.badgeText, status === "Flagged" && styles.flaggedText]}>{status}</Text>
              </View>
              <Text style={styles.colStrong}>{yieldKg}</Text>
            </View>
          ))}
        </View>

        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}

const styles = StyleSheet.create({
  page: { padding: 32, backgroundColor: "#fcf9f8" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { color: "#163c2d", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#66736d", marginTop: 6, fontWeight: "700" },
  primary: { backgroundColor: "#07543b", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  primaryText: { color: "#ffffff", fontWeight: "900" },
  stats: { gap: 16, marginTop: 28 },
  statsDesktop: { flexDirection: "row" },
  statCard: { flex: 1, minWidth: 190, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22 },
  statLabel: { color: "#354b40", fontWeight: "900" },
  statValue: { color: "#07543b", fontSize: 28, fontWeight: "900", marginTop: 12 },
  statHint: { color: "#628172", marginTop: 8, fontWeight: "700" },
  panel: { marginTop: 30, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22 },
  panelHead: { flexDirection: "row", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" },
  panelTitle: { color: "#163c2d", fontSize: 22, fontWeight: "900" },
  filters: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  search: { minWidth: 250, borderWidth: 1, borderColor: "#e4dfdc", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  placeholder: { color: "#7a827d", fontWeight: "700" },
  filterButton: { width: 42, height: 42, borderRadius: 8, borderWidth: 1, borderColor: "#e4dfdc", alignItems: "center", justifyContent: "center" },
  tableHead: { marginTop: 24, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#ebe6e4", flexDirection: "row", gap: 12 },
  tableRow: { minHeight: 78, borderBottomWidth: 1, borderBottomColor: "#f0ecea", flexDirection: "row", alignItems: "center", gap: 12 },
  nameCol: { flex: 2, flexDirection: "row", alignItems: "center", gap: 10, color: "#163c2d", fontSize: 12, fontWeight: "900" },
  col: { flex: 1, color: "#263b31", fontSize: 12, fontWeight: "800" },
  colStrong: { flex: 1, color: "#07543b", fontSize: 12, fontWeight: "900" },
  avatar: { width: 36, height: 36, borderRadius: 999, backgroundColor: "#d8f6e5", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#07543b", fontSize: 10, fontWeight: "900" },
  rowName: { color: "#163c2d", fontWeight: "900" },
  rowMeta: { color: "#738077", marginTop: 3, fontSize: 11, fontWeight: "700" },
  badge: { flex: 1, backgroundColor: "#d5f8df", borderRadius: 999, alignItems: "center", paddingVertical: 6 },
  pending: { backgroundColor: "#f1eee8" },
  flagged: { backgroundColor: "#ffe4e2" },
  badgeText: { color: "#07543b", fontSize: 10, fontWeight: "900" },
  flaggedText: { color: "#ba1a1a" },
})
