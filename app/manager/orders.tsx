import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerButton, ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const harvests = [
  ["Oct 24, 2024", "#HV-8924", "2024 Short Rains", "Avocado (Hass)", "1,250", "Export"],
  ["Oct 15, 2024", "#HV-8910", "2024 Short Rains", "Avocado (Fuerte)", "840", "Local"],
  ["Sep 02, 2024", "#HV-8850", "2024 Short Rains", "Macadamia", "320", "Export"],
  ["Jun 18, 2024", "#HV-8702", "2024 Long Rains", "Avocado (Hass)", "2,100", "Export"],
  ["May 30, 2024", "#HV-8695", "2024 Long Rains", "Avocado (Fuerte)", "650", "Processing"],
]

const summaries = [
  ["Total Yield (YTD)", "5,160 kg", "+12% vs last year", "agriculture"],
  ["Export Grade Quality", "82%", "Premium eligible", "verified"],
  ["Active Harvests", "2", "Awaiting collection", "local-shipping"],
]

export default function ManagerOrders() {
  const { width } = useWindowDimensions()
  const desktop = width >= 980

  return (
    <ManagerLayout
      active="Orders"
      title="Harvest History"
      subtitle="Review past harvests, yields, and grading for registered crops."
      action={
        <View style={styles.topActions}>
          <ManagerButton icon="file-download" label="Export" variant="outline" />
          <ManagerButton icon="add" label="New Record" />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.filters, desktop && styles.filtersDesktop]}>
          <View style={styles.search}>
            <MaterialIcons name="search" size={22} color="#bfc9c1" />
            <Text style={styles.placeholder}>Search by Harvest ID or Crop...</Text>
          </View>
          <View style={styles.select}><Text style={styles.selectText}>Season</Text><MaterialIcons name="arrow-drop-down" size={24} color="#707973" /></View>
          <View style={styles.select}><Text style={styles.selectText}>Grade</Text><MaterialIcons name="arrow-drop-down" size={24} color="#707973" /></View>
          <View style={styles.clearFilter}><MaterialIcons name="filter-alt-off" size={22} color="#1b1b1b" /></View>
        </View>

        <View style={styles.tableCard}>
          <MaterialIcons name="eco" size={132} color="rgba(45,106,79,0.05)" style={styles.tableWatermark} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={styles.dateCol}>Date</Text>
                <Text style={styles.idCol}>Harvest ID</Text>
                <Text style={styles.seasonCol}>Crop Season</Text>
                <Text style={styles.varietyCol}>Variety</Text>
                <Text style={styles.qtyCol}>Qty (kg)</Text>
                <Text style={styles.gradeCol}>Grade</Text>
                <Text style={styles.actionCol}>Action</Text>
              </View>
              {harvests.map(([date, id, season, variety, qty, grade]) => (
                <View key={id} style={styles.row}>
                  <Text style={styles.dateText}>{date}</Text>
                  <Text style={styles.idText}>{id}</Text>
                  <Text style={styles.seasonText}>{season}</Text>
                  <Text style={styles.varietyText}>{variety}</Text>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <View style={[styles.gradePill, grade !== "Export" && styles.gradeNeutral]}>
                    <Text style={[styles.gradeText, grade !== "Export" && styles.gradeTextNeutral]}>{grade}</Text>
                  </View>
                  <View style={styles.actionIcon}><MaterialIcons name="more-vert" size={20} color="#707973" /></View>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.pagination}>
            <Text style={styles.pageMeta}>Showing 1 to 5 of 42 entries</Text>
            <View style={styles.pages}>
              <Text style={styles.pageMuted}>‹</Text>
              <Text style={styles.pageActive}>1</Text>
              <Text style={styles.page}>2</Text>
              <Text style={styles.page}>3</Text>
              <Text style={styles.page}>...</Text>
              <Text style={styles.page}>9</Text>
              <Text style={styles.pageMuted}>›</Text>
            </View>
          </View>
        </View>

        <View style={[styles.summaryGrid, desktop && styles.summaryGridDesktop]}>
          {summaries.map(([label, value, hint, icon]) => (
            <View key={label} style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <MaterialIcons name={icon as never} size={22} color="#2d6a4f" />
              </View>
              <Text style={styles.summaryValue}>{value}</Text>
              <Text style={styles.summaryHint}>{hint}</Text>
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
  topActions: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  filters: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, gap: 16, shadowColor: "#2d6a4f", shadowOpacity: 0.04, shadowRadius: 24 },
  filtersDesktop: { flexDirection: "row", alignItems: "center" },
  search: { flex: 1, minWidth: 280, borderRadius: 12, borderWidth: 1, borderColor: "#dcd9d9", paddingHorizontal: 16, paddingVertical: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  placeholder: { color: "#707973", fontSize: 16 },
  select: { minWidth: 170, borderRadius: 12, borderWidth: 1, borderColor: "#dcd9d9", paddingHorizontal: 16, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectText: { color: "#1b1b1b", fontSize: 16 },
  clearFilter: { width: 54, height: 54, borderRadius: 12, borderWidth: 1, borderColor: "#bfc9c1", alignItems: "center", justifyContent: "center" },
  tableCard: { marginTop: 64, backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.04, shadowRadius: 24 },
  tableWatermark: { position: "absolute", right: -30, bottom: -34, transform: [{ rotate: "-15deg" }] },
  table: { minWidth: 900 },
  tableHead: { flexDirection: "row", backgroundColor: "#f6f3f2", borderBottomWidth: 1, borderBottomColor: "#dcd9d9" },
  dateCol: { width: 140, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  idCol: { width: 130, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  seasonCol: { width: 170, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  varietyCol: { width: 170, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  qtyCol: { width: 110, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase", textAlign: "right" },
  gradeCol: { width: 110, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  actionCol: { width: 70, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase", textAlign: "center" },
  row: { minHeight: 72, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eae7e7" },
  dateText: { width: 140, paddingHorizontal: 24, color: "#1b1b1b" },
  idText: { width: 130, paddingHorizontal: 24, color: "#2d6a4f", fontWeight: "900" },
  seasonText: { width: 170, paddingHorizontal: 24, color: "#404943" },
  varietyText: { width: 170, paddingHorizontal: 24, color: "#1b1b1b" },
  qtyText: { width: 110, paddingHorizontal: 24, color: "#1b1b1b", fontWeight: "900", textAlign: "right" },
  gradePill: { width: 84, marginLeft: 24, borderRadius: 999, backgroundColor: "#a0f4c8", paddingVertical: 6, alignItems: "center" },
  gradeNeutral: { backgroundColor: "#e5e2e1" },
  gradeText: { color: "#005236", fontSize: 11, fontWeight: "900" },
  gradeTextNeutral: { color: "#48473a" },
  actionIcon: { width: 70, alignItems: "center" },
  pagination: { padding: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  pageMeta: { color: "#404943", fontSize: 13 },
  pages: { flexDirection: "row", gap: 8, alignItems: "center" },
  pageActive: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#0f5238", color: "#ffffff", textAlign: "center", paddingTop: 7, fontWeight: "900", overflow: "hidden" },
  page: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: "#dcd9d9", color: "#1b1b1b", textAlign: "center", paddingTop: 7, overflow: "hidden" },
  pageMuted: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: "#dcd9d9", color: "#707973", textAlign: "center", paddingTop: 6, overflow: "hidden" },
  summaryGrid: { gap: 24, marginTop: 40 },
  summaryGridDesktop: { flexDirection: "row" },
  summaryCard: { flex: 1, minWidth: 230, backgroundColor: "#ffffff", borderRadius: 12, padding: 24, shadowColor: "#2d6a4f", shadowOpacity: 0.04, shadowRadius: 24 },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: "#404943", fontSize: 16, fontWeight: "800" },
  summaryValue: { color: "#1b1b1b", fontSize: 28, fontWeight: "900", marginTop: 16 },
  summaryHint: { color: "#707973", marginTop: 8 },
})
