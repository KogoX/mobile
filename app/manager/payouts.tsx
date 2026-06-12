import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerButton, ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const cards = [
  ["Current Season Earnings", "$45,250.00", "+12.5% from last season", "account-balance-wallet", "#2d6a4f"],
  ["Pending Payments", "$3,840.50", "Expected clearance in 3-5 business days", "pending-actions", "#005337"],
  ["Total Disbursed", "$124,500.00", "Lifetime earnings since 2021", "check-circle", "#0f5238"],
]

const rows = [
  ["Oct 24, 2024", "#ORD-7829", "EuroFresh Imports Ltd.", "1,250", "$4,500.00", "Disbursed"],
  ["Oct 21, 2024", "#ORD-7815", "Global AgriCorp", "850", "$3,060.00", "Processing"],
  ["Oct 18, 2024", "#ORD-7790", "Nordic Organics", "2,100", "$7,560.00", "Disbursed"],
  ["Oct 15, 2024", "#ORD-7742", "Sunshine Produce", "450", "$1,620.00", "Flagged"],
]

export default function ManagerPayouts() {
  const { width } = useWindowDimensions()
  const desktop = width >= 980

  return (
    <ManagerLayout
      active="Payments"
      title="Payments Dashboard"
      subtitle="Financial overview and transaction history for the current season."
      action={<ManagerButton icon="file-download" label="Download Statement" variant="outline" />}
    >
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.cardGrid, desktop && styles.cardGridDesktop]}>
          {cards.map(([title, value, hint, icon, color]) => (
            <View key={title} style={styles.moneyCard}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{title}</Text>
                <View style={styles.cardIcon}><MaterialIcons name={icon as never} size={24} color={color} /></View>
              </View>
              <Text style={[styles.moneyValue, { color }]}>{value}</Text>
              <Text style={styles.moneyHint}>{hint}</Text>
              <View style={styles.leafMark}><MaterialIcons name="eco" size={84} color="#2d6a4f" /></View>
            </View>
          ))}
        </View>

        <View style={styles.transactions}>
          <View style={styles.transactionHead}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <View style={styles.search}>
              <MaterialIcons name="search" size={18} color="#707973" />
              <Text style={styles.searchText}>Search orders...</Text>
              <MaterialIcons name="filter-list" size={20} color="#404943" />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={styles.dateHead}>Date</Text>
                <Text style={styles.orderHead}>Order ID</Text>
                <Text style={styles.buyerHead}>Buyer</Text>
                <Text style={styles.qtyHead}>Quantity (kg)</Text>
                <Text style={styles.amountHead}>Amount</Text>
                <Text style={styles.statusHead}>Status</Text>
                <Text style={styles.actionHead}> </Text>
              </View>
              {rows.map(([date, order, buyer, qty, amount, status]) => (
                <View key={order} style={styles.row}>
                  <Text style={styles.dateCell}>{date}</Text>
                  <Text style={styles.orderCell}>{order}</Text>
                  <Text style={styles.buyerCell}>{buyer}</Text>
                  <Text style={styles.qtyCell}>{qty}</Text>
                  <Text style={styles.amountCell}>{amount}</Text>
                  <View style={[styles.status, status === "Processing" && styles.processing, status === "Flagged" && styles.flagged]}>
                    <Text style={[styles.statusText, status === "Flagged" && styles.flaggedText]}>{status}</Text>
                  </View>
                  <View style={styles.actionCell}><MaterialIcons name="more-vert" size={20} color="#2d6a4f" /></View>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.pagination}>
            <Text style={styles.pageMeta}>Showing 1-4 of 24 transactions</Text>
            <View style={styles.pages}>
              <Text style={styles.pageMuted}>‹</Text>
              <Text style={styles.pageNext}>›</Text>
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
  cardGrid: { gap: 24 },
  cardGridDesktop: { flexDirection: "row" },
  moneyCard: { flex: 1, minWidth: 260, minHeight: 210, backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#eae7e7", padding: 24, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.06, shadowRadius: 24 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 14 },
  cardTitle: { flex: 1, color: "#1b1b1b", fontSize: 26, fontWeight: "900", fontFamily: "serif", lineHeight: 32 },
  cardIcon: { width: 42, height: 42, borderRadius: 999, backgroundColor: "rgba(149,212,179,0.2)", alignItems: "center", justifyContent: "center" },
  moneyValue: { fontSize: 40, fontWeight: "900", marginTop: 16 },
  moneyHint: { color: "#605f50", fontSize: 16, marginTop: 8 },
  leafMark: { position: "absolute", right: -18, bottom: -20, opacity: 0.05 },
  transactions: { marginTop: 64, backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.06, shadowRadius: 24 },
  transactionHead: { padding: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" },
  sectionTitle: { color: "#1b1b1b", fontSize: 36, fontWeight: "900", fontFamily: "serif" },
  search: { minWidth: 250, borderRadius: 999, borderWidth: 1, borderColor: "#eae7e7", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  searchText: { flex: 1, color: "#707973" },
  table: { minWidth: 930 },
  tableHead: { flexDirection: "row", backgroundColor: "#f6f3f2", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#eae7e7" },
  dateHead: { width: 140, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  orderHead: { width: 130, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  buyerHead: { width: 220, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  qtyHead: { width: 130, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase", textAlign: "right" },
  amountHead: { width: 130, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase", textAlign: "right" },
  statusHead: { width: 120, padding: 24, color: "#404943", fontSize: 12, fontWeight: "900", textTransform: "uppercase", textAlign: "center" },
  actionHead: { width: 60, padding: 24 },
  row: { minHeight: 66, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eae7e7" },
  dateCell: { width: 140, paddingHorizontal: 24, color: "#605f50" },
  orderCell: { width: 130, paddingHorizontal: 24, color: "#1b1b1b", fontWeight: "800" },
  buyerCell: { width: 220, paddingHorizontal: 24, color: "#1b1b1b" },
  qtyCell: { width: 130, paddingHorizontal: 24, color: "#1b1b1b", textAlign: "right" },
  amountCell: { width: 130, paddingHorizontal: 24, color: "#1b1b1b", textAlign: "right", fontWeight: "800" },
  status: { width: 96, marginLeft: 12, borderRadius: 999, backgroundColor: "#a0f4c8", alignItems: "center", paddingVertical: 6 },
  processing: { backgroundColor: "#e5e2e1" },
  flagged: { backgroundColor: "#ffdad6" },
  statusText: { color: "#005236", fontSize: 11, fontWeight: "900" },
  flaggedText: { color: "#93000a" },
  actionCell: { width: 60, alignItems: "center" },
  pagination: { padding: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  pageMeta: { color: "#404943", fontSize: 13 },
  pages: { flexDirection: "row", gap: 10 },
  pageMuted: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: "#bfc9c1", color: "#707973", textAlign: "center", paddingTop: 7, overflow: "hidden" },
  pageNext: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: "#bfc9c1", color: "#1b1b1b", textAlign: "center", paddingTop: 7, overflow: "hidden" },
})
