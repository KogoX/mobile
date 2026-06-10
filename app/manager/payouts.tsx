import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { ManagerTop, Sidebar } from "./index"

const payouts = [
  ["Samuel Mwangi", "KE-KM-8821", "1,420 KG", "KES 42,600", "Disbursed"],
  ["Jane Njeri", "KE-KM-5510", "890 KG", "KES 26,700", "Pending"],
  ["Emmanuel Otieno", "KE-KM-1204", "2,110 KG", "KES 63,300", "Disbursed"],
  ["Mary Wanjiku", "KE-KM-3392", "540 KG", "KES 16,200", "Flagged"],
] as const

export default function ManagerPayouts() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 920

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ManagerTop active="Payouts" onDashboard={() => router.push("/manager")} onOrders={() => router.push("/manager/orders")} onPayouts={() => router.push("/manager/payouts")} />
      <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
        <Sidebar active="Payouts" isDesktop={isDesktop} onDashboard={() => router.push("/manager")} onOrders={() => router.push("/manager/orders")} onPayouts={() => router.push("/manager/payouts")} />
        <View style={styles.main}>
          <View style={[styles.header, isDesktop && styles.headerWide]}>
            <View>
              <Text style={styles.title}>Payments & Payouts</Text>
              <Text style={styles.subtitle}>Oversee farmer disbursements, flagged records, and cooperative settlements</Text>
            </View>
            <Pressable style={styles.primaryButton}>
              <MaterialIcons name="payments" size={19} color="#ffffff" />
              <Text style={styles.primaryText}>Run Payouts</Text>
            </Pressable>
          </View>

          <View style={[styles.kpiGrid, isDesktop && styles.kpiGridWide]}>
            <Kpi label="Ready to Disburse" value="KES 1.84M" note="64 farmer records" />
            <Kpi label="Pending Review" value="KES 428K" note="18 approvals needed" />
            <Kpi label="Paid This Month" value="KES 6.2M" note="+21% vs last month" />
          </View>

          <View style={[styles.approvalPanel, isDesktop && styles.approvalPanelWide]}>
            <View style={styles.bigCard}>
              <Text style={styles.sectionTitle}>Disbursement Queue</Text>
              <Text style={styles.muted}>Priority farmers awaiting manager confirmation.</Text>
              {payouts.map(([name, id, qty, amount, status]) => (
                <View key={id} style={[styles.payoutRow, isDesktop && styles.payoutRowWide]}>
                  <View style={styles.person}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{name.split(" ").map((part) => part[0]).join("")}</Text></View>
                    <View>
                      <Text style={styles.name}>{name}</Text>
                      <Text style={styles.id}>{id}</Text>
                    </View>
                  </View>
                  <Text style={styles.qty}>{qty}</Text>
                  <Text style={styles.amount}>{amount}</Text>
                  <Status status={status} />
                </View>
              ))}
            </View>

            <View style={styles.sideStack}>
              <View style={styles.sideCard}>
                <Text style={styles.sectionTitle}>Approval Health</Text>
                <View style={styles.ring}>
                  <Text style={styles.ringValue}>92%</Text>
                  <Text style={styles.ringLabel}>clean records</Text>
                </View>
                <Text style={styles.muted}>Eight records need yield or quality reconciliation before payout.</Text>
              </View>
              <View style={styles.tipCard}>
                <MaterialIcons name="verified-user" size={24} color="#005337" />
                <View style={styles.flexOne}>
                  <Text style={styles.tipTitle}>Audit Ready</Text>
                  <Text style={styles.tipText}>All disbursements include farmer ID, yield batch, buyer order, and timestamp.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return <View style={styles.kpi}><Text style={styles.kpiLabel}>{label}</Text><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiNote}>{note}</Text></View>
}

function Status({ status }: { status: string }) {
  const style = status === "Flagged" ? styles.flagged : status === "Pending" ? styles.pending : styles.disbursed
  return <Text style={[styles.status, style]}>{status}</Text>
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fcf9f8" },
  content: { paddingBottom: 36 },
  shell: { width: "100%", maxWidth: 1280, alignSelf: "center" },
  shellDesktop: { flexDirection: "row" },
  main: { flex: 1, padding: 20, gap: 20 },
  header: { gap: 14 },
  headerWide: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#0f5238", fontSize: 34, lineHeight: 41, fontWeight: "900" },
  subtitle: { color: "#707973", fontSize: 14, lineHeight: 22, marginTop: 4 },
  primaryButton: { alignSelf: "flex-start", backgroundColor: "#0f5238", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  primaryText: { color: "#ffffff", fontWeight: "900" },
  kpiGrid: { gap: 14 },
  kpiGridWide: { flexDirection: "row" },
  kpi: { flex: 1, backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 18, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  kpiLabel: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  kpiValue: { color: "#0f5238", fontSize: 30, fontWeight: "900", marginVertical: 8 },
  kpiNote: { color: "#404943" },
  approvalPanel: { gap: 18 },
  approvalPanelWide: { flexDirection: "row", alignItems: "flex-start" },
  bigCard: { flex: 2, backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 18, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  sectionTitle: { color: "#0f5238", fontSize: 22, fontWeight: "900" },
  muted: { color: "#707973", lineHeight: 22, marginTop: 5, marginBottom: 14 },
  payoutRow: { gap: 10, paddingVertical: 14, borderBottomColor: "#f0eded", borderBottomWidth: 1 },
  payoutRowWide: { flexDirection: "row", alignItems: "center" },
  person: { flex: 2, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 999, backgroundColor: "#b1f0ce", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#0f5238", fontSize: 12, fontWeight: "900" },
  name: { color: "#0f5238", fontWeight: "900" },
  id: { color: "#707973", fontSize: 12 },
  qty: { flex: 1, color: "#404943", fontWeight: "800" },
  amount: { flex: 1, color: "#0f5238", fontWeight: "900" },
  status: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  disbursed: { backgroundColor: "#a0f4c8", color: "#005236" },
  pending: { backgroundColor: "#e6e3d0", color: "#48473a" },
  flagged: { backgroundColor: "#ffdad6", color: "#93000a" },
  sideStack: { flex: 1, gap: 18 },
  sideCard: { backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 18, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  ring: { width: 170, height: 170, borderRadius: 999, borderColor: "#a0f4c8", borderWidth: 18, alignSelf: "center", alignItems: "center", justifyContent: "center", marginVertical: 20 },
  ringValue: { color: "#0f5238", fontSize: 34, fontWeight: "900" },
  ringLabel: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  tipCard: { backgroundColor: "#effaf3", borderColor: "#c9ead6", borderWidth: 1, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  flexOne: { flex: 1 },
  tipTitle: { color: "#005337", fontWeight: "900" },
  tipText: { color: "#005236", lineHeight: 20, marginTop: 3 },
})
