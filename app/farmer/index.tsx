import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native"

const logo = require("../../assets/cemslogo.svg")

const stats = [
  ["agriculture", "Total Yield (kg)", "14,280", "+12% vs last mo"],
  ["account-balance-wallet", "Pending Payments (KES)", "428,500", ""],
  ["shopping-bag", "Completed Orders", "84", ""],
  ["workspace-premium", "Cooperative Rank", "#04", "Top Performer"],
] as const

const bars = [
  ["Jan", 40],
  ["Feb", 55],
  ["Mar", 45],
  ["Apr", 70],
  ["May", 90],
  ["Jun", 80],
] as const

const payments = [
  ["ORD-2024-892", "Global Green Exporters", "1,200 kg", "KES 36,000.00", "Verified"],
  ["ORD-2024-885", "EuroHarvest GmbH", "850 kg", "KES 25,500.00", "Pending"],
  ["ORD-2024-870", "AvoDirect UK Ltd.", "2,400 kg", "KES 72,000.00", "Verified"],
] as const

export default function FarmerDashboard() {
  const { width } = useWindowDimensions()
  const isWide = width >= 900

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} contentFit="contain" />
          <Text style={styles.brandText}>CEMS</Text>
        </View>
        <View style={styles.navRow}>
          <Text style={styles.navActive}>Dashboard</Text>
          {isWide ? <Text style={styles.navItem}>Markets</Text> : null}
          {isWide ? <Text style={styles.navItem}>Resources</Text> : null}
        </View>
      </View>

      <View style={styles.container}>
        <View style={[styles.welcome, isWide && styles.welcomeWide]}>
          <View>
            <Text style={[styles.title, !isWide && styles.titleMobile]}>Good morning, Peter</Text>
            <Text style={styles.lead}>Your orchard is thriving. Here's your export summary for today.</Text>
          </View>
          <View style={styles.verifiedPill}>
            <MaterialIcons name="verified" size={20} color="#002113" />
            <Text style={styles.verifiedText}>Tier 1 Verified Producer</Text>
          </View>
        </View>

        <View style={[styles.statsGrid, isWide && styles.statsGridWide]}>
          {stats.map(([icon, label, value, note], index) => (
            <View key={label} style={[styles.statCard, index === 3 && styles.rankCard]}>
              <View style={styles.statTop}>
                <View style={[styles.statIcon, index === 3 && styles.rankIcon]}>
                  <MaterialIcons
                    name={icon as keyof typeof MaterialIcons.glyphMap}
                    size={23}
                    color={index === 3 ? "#a3e635" : "#0f5238"}
                  />
                </View>
                {note && index !== 3 ? <Text style={styles.statNote}>{note}</Text> : null}
              </View>
              <Text style={[styles.statLabel, index === 3 && styles.rankLabel]}>{label}</Text>
              <Text style={[styles.statValue, index === 3 && styles.rankValue]}>
                {value} {index === 3 ? <Text style={styles.rankSub}>{note}</Text> : null}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
          <View style={styles.harvestCard}>
            <Text style={styles.sectionTitle}>Log New Harvest</Text>
            <FormField label="Crop Season" value="Main Season 2024" />
            <FormField label="Quantity (Kilograms)" value="0.00" input />
            <Text style={styles.label}>Produce Grade</Text>
            <View style={styles.gradeRow}>
              {["A", "B", "C"].map((grade) => (
                <Pressable key={grade} style={[styles.gradeButton, grade === "A" && styles.gradeActive]}>
                  <Text style={[styles.gradeText, grade === "A" && styles.gradeTextActive]}>{grade}</Text>
                </Pressable>
              ))}
            </View>
            <FormField label="Harvest Date" value="Select date" />
            <Pressable style={styles.submitButton}>
              <MaterialIcons name="add-task" size={20} color="#ffffff" />
              <Text style={styles.submitText}>Submit Yield Record</Text>
            </Pressable>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHead}>
              <View>
                <Text style={styles.sectionTitle}>Earnings Performance</Text>
                <Text style={styles.muted}>Export revenue trends over the last 6 months</Text>
              </View>
              <MaterialIcons name="download" size={22} color="#404943" />
            </View>
            <View style={styles.chartArea}>
              {bars.map(([month, height]) => (
                <View key={month} style={styles.barWrap}>
                  <View style={[styles.bar, { height: `${height}%` }]} />
                  <Text style={styles.barLabel}>{month}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartFooter}>
              <Metric label="Average Yield" value="2,380kg" />
              <View style={styles.divider} />
              <Metric label="Growth Rate" value="+18.4%" primary />
            </View>
          </View>
        </View>

        <View style={styles.paymentsCard}>
          <View style={[styles.paymentsHead, isWide && styles.paymentsHeadWide]}>
            <View>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <Text style={styles.muted}>Track recent settlements from international buyers</Text>
            </View>
            <Pressable style={styles.statementButton}>
              <Text style={styles.statementText}>View All Statement</Text>
            </Pressable>
          </View>
          <View style={styles.paymentList}>
            {payments.map(([id, buyer, quantity, amount, status]) => (
              <View key={id} style={[styles.paymentRow, isWide && styles.paymentRowWide]}>
                <Text style={styles.paymentId}>{id}</Text>
                <Text style={styles.paymentCell}>{buyer}</Text>
                <Text style={styles.paymentCell}>{quantity}</Text>
                <Text style={styles.paymentAmount}>{amount}</Text>
                <Text style={[styles.paymentStatus, status === "Verified" ? styles.verifiedStatus : styles.pendingStatus]}>
                  {status}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

function FormField({ label, value, input }: { label: string; value: string; input?: boolean }) {
  return (
    <View style={styles.formBlock}>
      <Text style={styles.label}>{label}</Text>
      {input ? (
        <TextInput style={styles.inputBox} placeholder={value} placeholderTextColor="#707973" keyboardType="numeric" />
      ) : (
        <View style={styles.inputBox}>
          <Text style={styles.inputText}>{value}</Text>
          <MaterialIcons name="expand-more" size={20} color="#707973" />
        </View>
      )}
    </View>
  )
}

function Metric({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.metricValue, primary && styles.primaryMetric]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fcf9f8" },
  content: { paddingBottom: 42 },
  topBar: {
    minHeight: 72,
    paddingHorizontal: 22,
    borderBottomColor: "#dcebe2",
    borderBottomWidth: 1,
    backgroundColor: "#fcf9f8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 22, height: 22 },
  brandText: { color: "#0f5238", fontSize: 22, fontWeight: "900" },
  navRow: { flexDirection: "row", gap: 18, alignItems: "center" },
  navActive: { color: "#0f5238", fontWeight: "900", textDecorationLine: "underline" },
  navItem: { color: "#605f50", fontWeight: "800" },
  container: { width: "100%", maxWidth: 1160, alignSelf: "center", padding: 20, gap: 22 },
  welcome: { gap: 14, marginTop: 12 },
  welcomeWide: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: { color: "#0f5238", fontSize: 42, lineHeight: 50, fontWeight: "900" },
  titleMobile: { fontSize: 32, lineHeight: 39 },
  lead: { color: "#404943", fontSize: 17, lineHeight: 26, marginTop: 6 },
  verifiedPill: { alignSelf: "flex-start", backgroundColor: "#a0f4c8", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  verifiedText: { color: "#002113", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  statsGrid: { gap: 14 },
  statsGridWide: { flexDirection: "row" },
  statCard: {
    flex: 1,
    minHeight: 160,
    backgroundColor: "#ffffff",
    borderColor: "#e0eee5",
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    justifyContent: "space-between",
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  rankCard: { backgroundColor: "#0f5238" },
  statTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  statIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#b1f0ce", alignItems: "center", justifyContent: "center" },
  rankIcon: { backgroundColor: "#0b3f2b" },
  statNote: { color: "#0f5238", fontSize: 12, fontWeight: "900" },
  statLabel: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginTop: 26 },
  rankLabel: { color: "#d9fbe7" },
  statValue: { color: "#1b1b1b", fontSize: 32, fontWeight: "900" },
  rankValue: { color: "#ffffff" },
  rankSub: { color: "#d9fbe7", fontSize: 14, fontWeight: "500" },
  mainGrid: { gap: 18 },
  mainGridWide: { flexDirection: "row" },
  harvestCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 18, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  chartCard: { flex: 2, backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 18, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  sectionTitle: { color: "#0f5238", fontSize: 26, lineHeight: 32, fontWeight: "900" },
  muted: { color: "#707973", lineHeight: 22, marginTop: 4 },
  formBlock: { marginTop: 14 },
  label: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginBottom: 8 },
  inputBox: { minHeight: 48, borderColor: "#bfc9c1", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", color: "#1b1b1b" },
  inputText: { color: "#1b1b1b", fontWeight: "700" },
  gradeRow: { flexDirection: "row", gap: 8, marginBottom: 2 },
  gradeButton: { flex: 1, borderColor: "#bfc9c1", borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  gradeActive: { backgroundColor: "#2d6a4f", borderColor: "#2d6a4f" },
  gradeText: { color: "#404943", fontWeight: "900" },
  gradeTextActive: { color: "#ffffff" },
  submitButton: { marginTop: 18, backgroundColor: "#0f5238", borderRadius: 999, minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { color: "#ffffff", fontWeight: "900" },
  chartHead: { flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 24 },
  chartArea: { height: 250, flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 6, paddingBottom: 28 },
  barWrap: { flex: 1, height: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { width: "100%", borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "#2d6a4f" },
  barLabel: { color: "#707973", fontSize: 11, fontWeight: "900", marginTop: 8 },
  chartFooter: { borderTopColor: "#e5e2e1", borderTopWidth: 1, paddingTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { color: "#1b1b1b", fontSize: 24, fontWeight: "900" },
  primaryMetric: { color: "#0f5238" },
  divider: { width: 1, height: 42, backgroundColor: "#e5e2e1" },
  paymentsCard: { backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  paymentsHead: { backgroundColor: "#f6f3f2", padding: 18, gap: 14 },
  paymentsHeadWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statementButton: { alignSelf: "flex-start", backgroundColor: "#ffffff", borderColor: "#bfc9c1", borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  statementText: { color: "#1b1b1b", fontWeight: "900" },
  paymentList: { padding: 12 },
  paymentRow: { gap: 8, paddingVertical: 14, borderBottomColor: "#f0eded", borderBottomWidth: 1 },
  paymentRowWide: { flexDirection: "row", alignItems: "center" },
  paymentId: { flex: 1, color: "#1b1b1b", fontWeight: "900" },
  paymentCell: { flex: 1.2, color: "#404943" },
  paymentAmount: { flex: 1, color: "#1b1b1b", fontWeight: "900" },
  paymentStatus: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: "900" },
  verifiedStatus: { backgroundColor: "#a0f4c8", color: "#005236" },
  pendingStatus: { backgroundColor: "#e6e3d0", color: "#48473a" },
})
