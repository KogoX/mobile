import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const harvests = [
  ["Oct 24, 2024", "#HV-8924", "2024 Short Rains", "Avocado (Hass)", "1,250", "Export"],
  ["Oct 15, 2024", "#HV-8910", "2024 Short Rains", "Avocado (Fuerte)", "840", "Local"],
  ["Sep 02, 2024", "#HV-8850", "2024 Short Rains", "Macadamia", "320", "Export"],
  ["Jun 18, 2024", "#HV-8702", "2024 Long Rains", "Avocado (Hass)", "2,100", "Export"],
  ["May 30, 2024", "#HV-8605", "2024 Long Rains", "Avocado (Fuerte)", "650", "Processing"],
]

const summaries = [
  ["Total Yield (YTD)", "5,160 kg", "12% vs last year", "agriculture"],
  ["Export Grade Quality", "82%", "Premium eligible", "verified"],
  ["Active Harvests", "2", "Awaiting collection", "local-shipping"],
]

export default function ManagerOrders() {
  const { width } = useWindowDimensions()
  const desktop = width >= 980

  return (
    <ManagerLayout active="Orders">
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Harvest History</Text>
            <Text style={styles.subtitle}>Review past harvests, yields, and grading for registered crops.</Text>
          </View>
          <View style={styles.actions}>
            <View style={styles.secondaryButton}>
              <MaterialIcons name="file-download" size={17} color="#07543b" />
              <Text style={styles.secondaryText}>Export</Text>
            </View>
            <View style={styles.primaryButton}>
              <MaterialIcons name="add" size={18} color="#ffffff" />
              <Text style={styles.primaryText}>New Record</Text>
            </View>
          </View>
        </View>

        <View style={[styles.filters, desktop && styles.filtersDesktop]}>
          <View style={styles.search}>
            <MaterialIcons name="search" size={16} color="#6f7973" />
            <Text style={styles.placeholder}>Search by Harvest ID or Crop...</Text>
          </View>
          <View style={styles.select}><Text style={styles.selectText}>Season</Text><MaterialIcons name="keyboard-arrow-down" size={18} color="#07543b" /></View>
          <View style={styles.select}><Text style={styles.selectText}>Grade</Text><MaterialIcons name="keyboard-arrow-down" size={18} color="#07543b" /></View>
          <View style={styles.iconButton}><MaterialIcons name="filter-list" size={18} color="#07543b" /></View>
        </View>

        <View style={styles.panel}>
          <View style={styles.tableHead}>
            <Text style={styles.dateCol}>Date</Text>
            <Text style={styles.col}>Harvest ID</Text>
            <Text style={styles.col}>Crop Season</Text>
            <Text style={styles.col}>Variety</Text>
            <Text style={styles.smallCol}>Qty (KG)</Text>
            <Text style={styles.smallCol}>Grade</Text>
            <Text style={styles.actionCol}>Action</Text>
          </View>
          {harvests.map(([date, id, season, variety, qty, grade]) => (
            <View key={id} style={styles.tableRow}>
              <Text style={styles.dateCol}>{date}</Text>
              <Text style={styles.idCol}>{id}</Text>
              <Text style={styles.col}>{season}</Text>
              <Text style={styles.col}>{variety}</Text>
              <Text style={styles.smallCol}>{qty}</Text>
              <View style={[styles.grade, grade !== "Export" && styles.gradeNeutral]}>
                <Text style={[styles.gradeText, grade !== "Export" && styles.gradeTextNeutral]}>{grade}</Text>
              </View>
              <MaterialIcons name="more-vert" size={20} color="#6f7973" style={styles.actionCol} />
            </View>
          ))}
          <View style={styles.pagination}>
            <Text style={styles.pageMeta}>Showing 1 to 5 of 42 entries</Text>
            <View style={styles.pages}>
              <Text style={styles.pageActive}>1</Text>
              <Text style={styles.pageNumber}>2</Text>
              <Text style={styles.pageNumber}>3</Text>
              <MaterialIcons name="chevron-right" size={18} color="#07543b" />
            </View>
          </View>
        </View>

        <View style={[styles.summaryGrid, desktop && styles.summaryGridDesktop]}>
          {summaries.map(([label, value, hint, icon]) => (
            <View key={label} style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <MaterialIcons name={icon as never} size={20} color="#0f8a5f" />
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { color: "#221816", fontSize: 34, fontWeight: "900" },
  subtitle: { color: "#66736d", marginTop: 6, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  secondaryButton: { borderWidth: 1, borderColor: "#cfd8d2", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#ffffff" },
  secondaryText: { color: "#07543b", fontWeight: "900" },
  primaryButton: { backgroundColor: "#07543b", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 7 },
  primaryText: { color: "#ffffff", fontWeight: "900" },
  filters: { marginTop: 30, gap: 12 },
  filtersDesktop: { flexDirection: "row", alignItems: "center" },
  search: { flex: 1.7, minWidth: 260, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e4dfdc", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 8 },
  placeholder: { color: "#7a827d", fontWeight: "700" },
  select: { flex: 0.7, minWidth: 150, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e4dfdc", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectText: { color: "#43584d", fontWeight: "800" },
  iconButton: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e4dfdc", alignItems: "center", justifyContent: "center" },
  panel: { marginTop: 30, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22 },
  tableHead: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#ebe6e4", flexDirection: "row", gap: 12 },
  tableRow: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: "#f0ecea", flexDirection: "row", alignItems: "center", gap: 12 },
  dateCol: { flex: 1, color: "#263b31", fontSize: 12, fontWeight: "800" },
  col: { flex: 1.15, color: "#263b31", fontSize: 12, fontWeight: "800" },
  idCol: { flex: 1.15, color: "#07543b", fontSize: 12, fontWeight: "900" },
  smallCol: { flex: 0.75, color: "#263b31", fontSize: 12, fontWeight: "800" },
  actionCol: { width: 46, color: "#263b31", fontSize: 12, fontWeight: "900" },
  grade: { flex: 0.75, backgroundColor: "#d5f8df", borderRadius: 999, alignItems: "center", paddingVertical: 6 },
  gradeNeutral: { backgroundColor: "#f1eee8" },
  gradeText: { color: "#07543b", fontSize: 10, fontWeight: "900" },
  gradeTextNeutral: { color: "#5f625f" },
  pagination: { paddingTop: 18, flexDirection: "row", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  pageMeta: { color: "#66736d", fontWeight: "700" },
  pages: { flexDirection: "row", alignItems: "center", gap: 9 },
  pageActive: { color: "#ffffff", backgroundColor: "#07543b", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5, overflow: "hidden", fontWeight: "900" },
  pageNumber: { color: "#607268", fontWeight: "900" },
  summaryGrid: { gap: 16, marginTop: 24 },
  summaryGridDesktop: { flexDirection: "row" },
  summaryCard: { flex: 1, minWidth: 210, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22 },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: "#53675d", fontWeight: "800" },
  summaryValue: { color: "#163c2d", fontSize: 24, fontWeight: "900", marginTop: 18 },
  summaryHint: { color: "#6a7c72", marginTop: 7, fontWeight: "700" },
})
