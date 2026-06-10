import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"

const logo = require("../assets/cemslogo.svg")

const nav = [
  ["dashboard", "Dashboard", "/manager"],
  ["groups", "Farmers", "/manager/farmers"],
  ["shopping-cart", "Orders", "/manager/orders"],
  ["payments", "Payments", "/manager/payouts"],
  ["analytics", "Reports", "/manager"],
  ["settings", "Settings", "/manager/settings"],
] as const

export function ManagerLayout({ active, children }: { active: string; children: ReactNode }) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const desktop = width >= 900

  return (
    <View style={styles.shell}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} contentFit="contain" />
          <Text style={styles.brandText}>CEMS</Text>
        </View>
      </View>

      <View style={desktop ? styles.bodyDesktop : styles.body}>
        {desktop ? (
          <View style={styles.sidebar}>
            <View style={styles.profile}>
              <View style={styles.profileIcon}>
                <MaterialIcons name="person" size={26} color="#d9fbe7" />
              </View>
              <View>
                <Text style={styles.profileName}>Cooperative Manager</Text>
                <Text style={styles.profileMeta}>Kiambu Sector</Text>
              </View>
            </View>
            <View style={styles.navStack}>
              {nav.map(([icon, label, href]) => (
                <Pressable
                  key={label}
                  style={[styles.navItem, active === label && styles.navActive]}
                  onPress={() => router.push(href as never)}
                >
                  <MaterialIcons name={icon} size={24} color={active === label ? "#a3e635" : "#9ccab8"} />
                  <Text style={[styles.navText, active === label && styles.navTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.mobileNav}>
            {nav.slice(0, 5).map(([icon, label, href]) => (
              <Pressable key={label} style={styles.mobileItem} onPress={() => router.push(href as never)}>
                <MaterialIcons name={icon} size={22} color={active === label ? "#0f5238" : "#707973"} />
                <Text style={[styles.mobileText, active === label && styles.mobileTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.main}>{children}</View>
      </View>
    </View>
  )
}

export function ManagerFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerBrand}>CEMS</Text>
      <Text style={styles.footerCopy}>2024 CEMS Kenya. Cultivating Export Excellence.</Text>
      <View style={styles.footerLinks}>
        <Text style={styles.footerLink}>Privacy Policy</Text>
        <Text style={styles.footerLink}>Terms of Service</Text>
        <Text style={styles.footerLink}>Export Guidelines</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { minHeight: "100%", backgroundColor: "#fcf9f8" },
  topBar: {
    height: 72,
    paddingHorizontal: 28,
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#d9f3e3",
    borderBottomWidth: 1,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 22, height: 22 },
  brandText: { color: "#0f5238", fontSize: 24, fontWeight: "900" },
  body: { flex: 1 },
  bodyDesktop: { flex: 1, flexDirection: "row" },
  sidebar: { width: 260, minHeight: 900, backgroundColor: "#07543b" },
  profile: {
    minHeight: 132,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: 1,
  },
  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#0c6547",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { color: "#ffffff", fontSize: 16, fontWeight: "900", lineHeight: 21 },
  profileMeta: { color: "#a3e635", marginTop: 3, fontWeight: "800" },
  navStack: { paddingTop: 24 },
  navItem: { minHeight: 58, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", gap: 18 },
  navActive: { backgroundColor: "#0c6547", borderRightColor: "#a3e635", borderRightWidth: 5 },
  navText: { color: "#9ccab8", fontSize: 16, fontWeight: "800" },
  navTextActive: { color: "#a3e635", fontWeight: "900" },
  mobileNav: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#d9f3e3",
    borderBottomWidth: 1,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  mobileItem: { alignItems: "center", gap: 3 },
  mobileText: { color: "#707973", fontSize: 10, fontWeight: "800" },
  mobileTextActive: { color: "#0f5238" },
  main: { flex: 1 },
  footer: {
    marginTop: 56,
    borderTopColor: "#d9f3e3",
    borderTopWidth: 1,
    backgroundColor: "#f6f6f4",
    padding: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
  },
  footerBrand: { color: "#0f5238", fontSize: 18, fontWeight: "900" },
  footerCopy: { color: "#0f5238", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  footerLinks: { flexDirection: "row", gap: 22, flexWrap: "wrap" },
  footerLink: { color: "#605f50", fontSize: 12, textDecorationLine: "underline", textTransform: "uppercase" },
})
