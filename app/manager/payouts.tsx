import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const cards = [
  ["Current Season Earnings", "$45,250.00", "+12.5% from last season", "account-balance-wallet"],
  ["Pending Payments", "$3,840.50", "Expected clearance in 3-5 business days", "pending-actions"],
  ["Total Disbursed", "$124,500.00", "Lifetime earnings since 2021", "verified"],
]

const transactions = [
  ["Oct 24, 2024", "#ORD-7829", "FarmFresh Imports Ltd", "1,250", "$4,500.00", "Disbursed"],
  ["Oct 21, 2024", "#ORD-7815", "Global AgriCorp", "850", "$3,060.00", "Processing"],
  ["Oct 18, 2024", "#ORD-7796", "Nordic Organics", "2,100", "$7,560.00", "Disbursed"],
  ["Oct 15, 2024", "#ORD-7742", "Sunrise Produce", "450", "$1,620.00", "Flagged"],
]

export default function ManagerPayouts() {
  const { width } = useWindowDimensions()
  const desktop = width >= 980

  return (
    <ManagerLayout active="Payments">
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Payments Dashboard</Text>
            <Text style={styles.subtitle}>Financial overview and transaction history for the current season.</Text>
          </View>
          <View style={styles.statementButton}>
            <MaterialIcons name="file-download" size={17} color="#07543b" />
            <Text style={styles.statementText}>Download Statement</Text>
          </View>
        </View>

        <View style={[styles.cardGrid, desktop && styles.cardGridDesktop]}>
          {cards.map(([label, value, hint, icon]) => (
            <View key={label} style={styles.moneyCard}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>{label}</Text>
                <View style={styles.cardIcon}>
                  <MaterialIcons name={icon as never} size={18} color="#0f8a5f" />
                </View>
              </View>
              <Text style={styles.cardValue}>{value}</Text>
              <Text style={styles.cardHint}>{hint}</Text>
              <View style={styles.watermark} />
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Recent Transactions</Text>
            <View style={styles.tools}>
              <View style={styles.search}>
                <MaterialIcons name="search" size={16} color="#6f7973" />
                <Text style={styles.placeholder}>Search orders...</Text>
              </View>
              <MaterialIcons name="filter-list" size={20} color="#07543b" />
            </View>
          </View>

          <View style={styles.tableHead}>
            <Text style={styles.dateCol}>Date</Text>
            <Text style={styles.col}>Order ID</Text>
            <Text style={styles.buyerCol}>Buyer</Text>
            <Text style={styles.smallCol}>Quantity (KG)</Text>
            <Text style={styles.col}>Amount</Text>
            <Text style={styles.smallCol}>Status</Text>
            <Text style={styles.actionCol}> </Text>
          </View>

          {transactions.map(([date, order, buyer, qty, amount, status]) => (
            <View key={order} style={styles.tableRow}>
              <Text style={styles.dateCol}>{date}</Text>
              <Text style={styles.idCol}>{order}</Text>
              <Text style={styles.buyerCol}>{buyer}</Text>
              <Text style={styles.smallCol}>{qty}</Text>
              <Text style={styles.amount}>{amount}</Text>
              <View style={[styles.status, status === "Processing" && styles.processing, status === "Flagged" && styles.flagged]}>
                <Text style={[styles.statusText, status === "Flagged" && styles.flaggedText]}>{status}</Text>
              </View>
              <MaterialIcons name="more-vert" size={20} color="#6f7973" style={styles.actionCol} />
            </View>
          ))}

          <View style={styles.pagination}>
            <Text style={styles.pageMeta}>Showing 1-4 of 24 transactions</Text>
            <View style={styles.pages}>
              <MaterialIcons name="chevron-left" size={18} color="#9aa39d" />
              <MaterialIcons name="chevron-right" size={18} color="#07543b" />
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
  title: { color: "#221816", fontSize: 34, fontWeight: "900" },
  subtitle: { color: "#66736d", marginTop: 6, fontWeight: "700" },
  statementButton: { borderWidth: 1, borderColor: "#9fbcaf", borderRadius: 22, paddingHorizontal: 17, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ffffff" },
  statementText: { color: "#07543b", fontWeight: "900" },
  cardGrid: { gap: 16, marginTop: 30 },
  cardGridDesktop: { flexDirection: "row" },
  moneyCard: { flex: 1, minWidth: 240, overflow: "hidden", backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 24 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardLabel: { flex: 1, color: "#221816", fontSize: 16, fontWeight: "900" },
  cardIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#e5f6ec", alignItems: "center", justifyContent: "center" },
  cardValue: { color: "#07543b", fontSize: 30, fontWeight: "900", marginTop: 16 },
  cardHint: { color: "#6d7771", marginTop: 9, fontWeight: "700" },
  watermark: { position: "absolute", right: -16, bottom: -18, width: 76, height: 76, borderRadius: 999, backgroundColor: "#f1f3ef" },
  panel: { marginTop: 34, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22 },
  panelHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  panelTitle: { color: "#221816", fontSize: 26, fontWeight: "900" },
  tools: { flexDirection: "row", alignItems: "center", gap: 14 },
  search: { minWidth: 210, borderWidth: 1, borderColor: "#e4dfdc", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  placeholder: { color: "#7a827d", fontWeight: "700" },
  tableHead: { marginTop: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#ebe6e4", flexDirection: "row", gap: 12 },
  tableRow: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: "#f0ecea", flexDirection: "row", alignItems: "center", gap: 12 },
  dateCol: { flex: 0.95, color: "#263b31", fontSize: 12, fontWeight: "800" },
  col: { flex: 1, color: "#263b31", fontSize: 12, fontWeight: "800" },
  buyerCol: { flex: 1.35, color: "#263b31", fontSize: 12, fontWeight: "800" },
  smallCol: { flex: 0.82, color: "#263b31", fontSize: 12, fontWeight: "800" },
  idCol: { flex: 1, color: "#07543b", fontSize: 12, fontWeight: "900" },
  amount: { flex: 1, color: "#163c2d", fontSize: 12, fontWeight: "900" },
  actionCol: { width: 34 },
  status: { flex: 0.82, backgroundColor: "#d5f8df", borderRadius: 999, alignItems: "center", paddingVertical: 6 },
  processing: { backgroundColor: "#f1eee8" },
  flagged: { backgroundColor: "#ffe4e2" },
  statusText: { color: "#07543b", fontSize: 10, fontWeight: "900" },
  flaggedText: { color: "#ba1a1a" },
  pagination: { paddingTop: 18, flexDirection: "row", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  pageMeta: { color: "#66736d", fontWeight: "700" },
  pages: { flexDirection: "row", gap: 12 },
})
