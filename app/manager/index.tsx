import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native"

const logo = require("../../assets/cemslogo.svg")

const metrics = [
  ["group", "Total Farmers", "1,284", "+12% from last month"],
  ["inventory", "Yield Aggregated", "42.8 MT", "Grade A quality"],
  ["shopping-cart", "Active Orders", "156", "98 scheduled for pickup"],
  ["priority-high", "Pending Approvals", "18", "Requires attention today"],
] as const

const farmers = [
  ["SM", "Samuel Mwangi", "KE-KM-8821", "1,420", "Disbursed"],
  ["JN", "Jane Njeri", "KE-KM-5510", "890", "Pending"],
  ["EO", "Emmanuel Otieno", "KE-KM-1204", "2,110", "Disbursed"],
  ["MW", "Mary Wanjiku", "KE-KM-3392", "540", "Flagged"],
] as const

const approvals = [
  ["#EXP-7721", "Premium Hass Batch", "850 KG", "Limuru", "Level 2"],
  ["#EXP-7724", "Standard Fuerte Batch", "1,200 KG", "Gatundu", "Level 1"],
] as const

export default function ManagerDashboard() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 920

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ManagerTop active="Dashboard" onDashboard={() => router.push("/manager")} onOrders={() => router.push("/manager/orders")} onPayouts={() => router.push("/manager/payouts")} />
      <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
        <Sidebar active="Dashboard" isDesktop={isDesktop} onDashboard={() => router.push("/manager")} onOrders={() => router.push("/manager/orders")} onPayouts={() => router.push("/manager/payouts")} />
        <View style={styles.main}>
          <View style={[styles.header, isDesktop && styles.headerWide]}>
            <View>
              <Text style={styles.title}>Operational Overview</Text>
              <Text style={styles.subtitle}>Harvest Season 2024 - Phase 2</Text>
            </View>
            <Pressable style={styles.exportButton}>
              <MaterialIcons name="description" size={18} color="#ffffff" />
              <Text style={styles.exportText}>Generate Export Log</Text>
            </Pressable>
          </View>

          <View style={[styles.metricGrid, isDesktop && styles.metricGridDesktop]}>
            {metrics.map(([icon, label, value, note], index) => (
              <View key={label} style={[styles.metricCard, index === 3 && styles.attentionCard]}>
                <MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={24} color="#0f5238" />
                <Text style={styles.metricLabel}>{label}</Text>
                <Text style={styles.metricValue}>{value}</Text>
                <Text style={styles.metricNote}>{note}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.dashboardGrid, isDesktop && styles.dashboardGridWide]}>
            <View style={styles.activityCard}>
              <View style={[styles.cardHead, isDesktop && styles.cardHeadWide]}>
                <Text style={styles.sectionTitle}>Farmer Activity List</Text>
                <View style={styles.searchBox}>
                  <MaterialIcons name="search" size={18} color="#707973" />
                  <TextInput style={styles.searchInput} placeholder="Search farmers..." placeholderTextColor="#707973" />
                </View>
              </View>
              {farmers.map(([initials, name, id, yieldKg, status]) => (
                <View key={id} style={[styles.farmerRow, isDesktop && styles.farmerRowWide]}>
                  <View style={styles.farmerIdentity}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                    <View>
                      <Text style={styles.farmerName}>{name}</Text>
                      <Text style={styles.farmerId}>{id}</Text>
                    </View>
                  </View>
                  <Text style={styles.yieldText}>{yieldKg} KG</Text>
                  <StatusPill status={status} />
                  <Pressable><Text style={styles.linkText}>View Details</Text></Pressable>
                </View>
              ))}
            </View>

            <View style={styles.queueColumn}>
              <Text style={styles.sectionTitle}>Approval Queue</Text>
              {approvals.map(([id, batch, weight, origin, level]) => (
                <View key={id} style={styles.approvalCard}>
                  <View style={styles.approvalTop}>
                    <View>
                      <Text style={styles.label}>Order {id}</Text>
                      <Text style={styles.approvalTitle}>{batch}</Text>
                    </View>
                    <Text style={styles.levelBadge}>{level}</Text>
                  </View>
                  <View style={styles.approvalStats}>
                    <MiniStat label="Weight" value={weight} />
                    <MiniStat label="Origin" value={origin} />
                  </View>
                  <View style={styles.approvalActions}>
                    <Pressable style={styles.approveButton}><Text style={styles.approveText}>Approve</Text></Pressable>
                    <Pressable style={styles.rejectButton}><Text style={styles.rejectText}>Reject</Text></Pressable>
                  </View>
                </View>
              ))}
              <View style={styles.tipCard}>
                <View style={styles.tipIcon}><MaterialIcons name="lightbulb" size={22} color="#98ebc0" /></View>
                <View style={styles.flexOne}>
                  <Text style={styles.tipTitle}>Optimization Tip</Text>
                  <Text style={styles.tipText}>Aggregating orders from Limuru could reduce logistics costs by 14%.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export function ManagerTop({ active, onDashboard, onOrders, onPayouts }: { active: string; onDashboard: () => void; onOrders: () => void; onPayouts: () => void }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.brand}><Image source={logo} style={styles.logo} contentFit="contain" /><Text style={styles.brandText}>CEMS</Text></View>
      <View style={styles.nav}>
        <Pressable onPress={onDashboard}><Text style={active === "Dashboard" ? styles.navActive : styles.navText}>Dashboard</Text></Pressable>
        <Pressable onPress={onOrders}><Text style={active === "Orders" ? styles.navActive : styles.navText}>Orders</Text></Pressable>
        <Pressable onPress={onPayouts}><Text style={active === "Payouts" ? styles.navActive : styles.navText}>Payouts</Text></Pressable>
      </View>
    </View>
  )
}

export function Sidebar({ active, isDesktop, onDashboard, onOrders, onPayouts }: { active: string; isDesktop: boolean; onDashboard: () => void; onOrders: () => void; onPayouts: () => void }) {
  if (!isDesktop) return null
  return (
    <View style={styles.sidebar}>
      <NavButton icon="dashboard" label="Dashboard" active={active === "Dashboard"} onPress={onDashboard} />
      <NavButton icon="group" label="Farmers" active={false} onPress={onDashboard} />
      <NavButton icon="shopping-cart" label="Orders" active={active === "Orders"} onPress={onOrders} />
      <NavButton icon="payments" label="Payouts" active={active === "Payouts"} onPress={onPayouts} />
      <NavButton icon="analytics" label="Reports" active={false} onPress={onDashboard} />
    </View>
  )
}

function NavButton({ icon, label, active, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.sideItem, active && styles.sideItemActive]} onPress={onPress}>
      <MaterialIcons name={icon} size={21} color={active ? "#a3e635" : "#d9fbe7"} />
      <Text style={[styles.sideText, active && styles.sideTextActive]}>{label}</Text>
    </Pressable>
  )
}

function StatusPill({ status }: { status: string }) {
  const isBad = status === "Flagged"
  const isPending = status === "Pending"
  return <Text style={[styles.status, isBad ? styles.flagged : isPending ? styles.pending : styles.disbursed]}>{status}</Text>
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <View><Text style={styles.label}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View>
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fcf9f8" },
  content: { paddingBottom: 36 },
  topBar: { minHeight: 72, paddingHorizontal: 20, borderBottomColor: "#dcebe2", borderBottomWidth: 1, backgroundColor: "#fcf9f8", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 22, height: 22 },
  brandText: { color: "#0f5238", fontSize: 22, fontWeight: "900" },
  nav: { flexDirection: "row", gap: 14, alignItems: "center" },
  navText: { color: "#605f50", fontWeight: "800" },
  navActive: { color: "#0f5238", fontWeight: "900", textDecorationLine: "underline" },
  shell: { width: "100%", maxWidth: 1280, alignSelf: "center" },
  shellDesktop: { flexDirection: "row", alignItems: "stretch" },
  sidebar: { width: 230, backgroundColor: "#0f5238", borderRadius: 18, paddingVertical: 18, margin: 20, gap: 4, alignSelf: "flex-start" },
  sideItem: { minHeight: 48, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  sideItemActive: { backgroundColor: "#0b3f2b", borderRightColor: "#a3e635", borderRightWidth: 4 },
  sideText: { color: "#d9fbe7", fontWeight: "800" },
  sideTextActive: { color: "#a3e635", fontWeight: "900" },
  main: { flex: 1, padding: 20, gap: 22 },
  header: { gap: 14 },
  headerWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: "#0f5238", fontSize: 34, lineHeight: 41, fontWeight: "900" },
  subtitle: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginTop: 5 },
  exportButton: { alignSelf: "flex-start", backgroundColor: "#0f5238", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  exportText: { color: "#ffffff", fontWeight: "900" },
  metricGrid: { gap: 14 },
  metricGridDesktop: { flexDirection: "row" },
  metricCard: { flex: 1, minHeight: 150, backgroundColor: "#ffffff", borderColor: "#e0eee5", borderWidth: 1, borderRadius: 16, padding: 18, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  attentionCard: { borderLeftColor: "#0f5238", borderLeftWidth: 4 },
  metricLabel: { color: "#707973", fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginTop: 16 },
  metricValue: { color: "#0f5238", fontSize: 32, fontWeight: "900", marginTop: 4 },
  metricNote: { color: "#404943", fontSize: 13, marginTop: 6 },
  dashboardGrid: { gap: 18 },
  dashboardGridWide: { flexDirection: "row", alignItems: "flex-start" },
  activityCard: { flex: 2, backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, overflow: "hidden", shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  cardHead: { padding: 18, gap: 12, borderBottomColor: "#e5e2e1", borderBottomWidth: 1 },
  cardHeadWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#0f5238", fontSize: 22, fontWeight: "900" },
  searchBox: { minHeight: 42, borderRadius: 999, borderColor: "#e5e2e1", borderWidth: 1, backgroundColor: "#f6f3f2", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13 },
  searchInput: { minWidth: 170, color: "#1b1b1b", outlineStyle: "none" as never },
  farmerRow: { gap: 10, padding: 16, borderBottomColor: "#f0eded", borderBottomWidth: 1 },
  farmerRowWide: { flexDirection: "row", alignItems: "center" },
  farmerIdentity: { flex: 2, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 999, backgroundColor: "#b1f0ce", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#0f5238", fontSize: 12, fontWeight: "900" },
  farmerName: { color: "#0f5238", fontWeight: "900" },
  farmerId: { color: "#707973", fontSize: 12 },
  yieldText: { flex: 1, color: "#1b1b1b", fontWeight: "900" },
  status: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  disbursed: { backgroundColor: "#a0f4c8", color: "#005236" },
  pending: { backgroundColor: "#e6e3d0", color: "#48473a" },
  flagged: { backgroundColor: "#ffdad6", color: "#93000a" },
  linkText: { color: "#0f5238", fontWeight: "900" },
  queueColumn: { flex: 1, gap: 14 },
  approvalCard: { backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e0eee5", borderWidth: 1, padding: 18, shadowColor: "#2d6a4f", shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  approvalTop: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  label: { color: "#707973", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  approvalTitle: { color: "#0f5238", fontSize: 17, fontWeight: "900", marginTop: 4 },
  levelBadge: { alignSelf: "flex-start", backgroundColor: "#f0eded", color: "#605f50", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: "900" },
  approvalStats: { borderTopColor: "#f0eded", borderTopWidth: 1, borderBottomColor: "#f0eded", borderBottomWidth: 1, paddingVertical: 12, flexDirection: "row", gap: 28, marginBottom: 14 },
  miniValue: { color: "#0f5238", fontWeight: "900", marginTop: 3 },
  approvalActions: { flexDirection: "row", gap: 10 },
  approveButton: { flex: 1, backgroundColor: "#0f5238", borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  approveText: { color: "#ffffff", fontWeight: "900" },
  rejectButton: { flex: 1, borderColor: "#ba1a1a", borderWidth: 1, borderRadius: 999, paddingVertical: 9, alignItems: "center" },
  rejectText: { color: "#ba1a1a", fontWeight: "900" },
  tipCard: { backgroundColor: "#effaf3", borderColor: "#c9ead6", borderWidth: 1, borderRadius: 16, padding: 18, flexDirection: "row", gap: 14, alignItems: "center" },
  tipIcon: { width: 44, height: 44, borderRadius: 999, backgroundColor: "#106d4b", alignItems: "center", justifyContent: "center" },
  flexOne: { flex: 1 },
  tipTitle: { color: "#005337", fontWeight: "900", marginBottom: 3 },
  tipText: { color: "#005236", lineHeight: 20 },
})
