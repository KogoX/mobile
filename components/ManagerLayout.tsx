import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"

const logo = require("../assets/cemslogo.svg")

const managerPhoto =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDA6vlv2MI1vQB2hYix3P2Rnc5jUJm_pTah5NZetjnc4V2Q3FtnIEB6t5-lRf3iq3Qjrb8MwN1Oijm4H6v6FaeHAFRgmSpSXkfkGx1gvAe3sge3xOq36v2E8FtCfgNZ4AcOuzeJbE4_Rtr2dOwjlrqoN394v0JGlQynkSWvFVRlcPGvqCEYm8xf0YOMIRKhcn2kO5FQrvRVfXpy-k-f1qquZdR_wF7q6S5GTiW_gDglyWI7mESocOzQ_nwaM1TZPj08Jo_DF2JJ0TNg"

const nav = [
  ["dashboard", "Dashboard", "/manager"],
  ["groups", "Farmers", "/manager/farmers"],
  ["shopping-cart", "Orders", "/manager/orders"],
  ["payments", "Payments", "/manager/payouts"],
  ["analytics", "Reports", "/manager"],
  ["settings", "Settings", "/manager/settings"],
] as const

export function ManagerLayout({
  active,
  title,
  subtitle,
  action,
  children,
}: {
  active: string
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const desktop = width >= 900

  return (
    <View style={styles.shell}>
      {desktop ? (
        <View style={styles.desktopSidebar}>
          <View style={styles.brandBlock}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
            <Text style={styles.brandText}>CEMS</Text>
          </View>
          <View style={styles.desktopNav}>
            {nav.map(([icon, label, href]) => (
              <Pressable
                key={label}
                style={[styles.navItem, active === label && styles.navActive]}
                onPress={() => router.push(href as never)}
              >
                <MaterialIcons name={icon} size={22} color={active === label ? "#a3e635" : "rgba(209,250,229,0.72)"} />
                <Text style={[styles.navText, active === label && styles.navTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.profileDock}>
            <Image source={{ uri: managerPhoto }} style={styles.profilePhoto} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Cooperative Manager</Text>
              <Text style={styles.profileMeta}>Kiambu Sector</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.mobileHeader}>
          <View style={styles.mobileBrand}>
            <Image source={logo} style={styles.mobileLogo} contentFit="contain" />
            <Text style={styles.mobileBrandText}>CEMS</Text>
          </View>
          <View style={styles.mobileNav}>
            {nav.slice(0, 5).map(([icon, label, href]) => (
              <Pressable key={label} style={styles.mobileNavItem} onPress={() => router.push(href as never)}>
                <MaterialIcons name={icon} size={20} color={active === label ? "#0f5238" : "#707973"} />
                <Text style={[styles.mobileNavText, active === label && styles.mobileNavTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.workspace, desktop && styles.workspaceDesktop]}>
        {(title || action) ? (
          <View style={styles.topAppBar}>
            <View style={styles.topTitleWrap}>
              {title ? <Text style={styles.topTitle}>{title}</Text> : null}
              {subtitle ? <Text style={styles.topSubtitle}>{subtitle}</Text> : null}
            </View>
            <View style={styles.topActions}>
              <View style={styles.notify}>
                <MaterialIcons name="notifications" size={22} color="#0f5238" />
                <View style={styles.notifyDot} />
              </View>
              {action}
            </View>
          </View>
        ) : null}
        {children}
      </View>
    </View>
  )
}

export function ManagerButton({ icon, label, variant = "filled" }: { icon?: string; label: string; variant?: "filled" | "outline" }) {
  return (
    <View style={[styles.button, variant === "outline" && styles.buttonOutline]}>
      {icon ? <MaterialIcons name={icon as never} size={18} color={variant === "outline" ? "#0f5238" : "#ffffff"} /> : null}
      <Text style={[styles.buttonText, variant === "outline" && styles.buttonOutlineText]}>{label}</Text>
    </View>
  )
}

export function ManagerFooter() {
  return (
    <View style={styles.footer}>
      <View>
        <Text style={styles.footerBrand}>CEMS</Text>
        <Text style={styles.footerCopy}>2024 CEMS Kenya. Cultivating Export Excellence.</Text>
      </View>
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
  desktopSidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 256,
    minHeight: 900,
    backgroundColor: "#064e3b",
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    zIndex: 10,
  },
  brandBlock: { height: 112, paddingHorizontal: 30, flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 26, height: 26 },
  brandText: { color: "#ffffff", fontSize: 26, fontWeight: "900" },
  desktopNav: { flex: 1 },
  navItem: {
    minHeight: 58,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRightWidth: 4,
    borderRightColor: "transparent",
  },
  navActive: { backgroundColor: "#065f46", borderRightColor: "#a3e635" },
  navText: { color: "rgba(209,250,229,0.72)", fontSize: 15, fontWeight: "800" },
  navTextActive: { color: "#a3e635", fontWeight: "900" },
  profileDock: { minHeight: 78, paddingHorizontal: 22, backgroundColor: "#022c22", flexDirection: "row", alignItems: "center", gap: 12 },
  profilePhoto: { width: 42, height: 42, borderRadius: 999, backgroundColor: "#e5e2e1" },
  profileName: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  profileMeta: { color: "rgba(209,250,229,0.68)", fontSize: 10, marginTop: 2 },
  mobileHeader: { backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#d9f3e3" },
  mobileBrand: { height: 58, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 8 },
  mobileLogo: { width: 22, height: 22 },
  mobileBrandText: { color: "#0f5238", fontSize: 22, fontWeight: "900" },
  mobileNav: { paddingHorizontal: 8, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between" },
  mobileNavItem: { minWidth: 58, alignItems: "center", gap: 2 },
  mobileNavText: { color: "#707973", fontSize: 10, fontWeight: "800" },
  mobileNavTextActive: { color: "#0f5238" },
  workspace: { minHeight: "100%" },
  workspaceDesktop: { marginLeft: 256 },
  topAppBar: {
    minHeight: 80,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: "#fafaf9",
    borderBottomWidth: 1,
    borderBottomColor: "#d9f3e3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    zIndex: 5,
  },
  topTitleWrap: { flex: 1, minWidth: 240 },
  topTitle: { color: "#0f5238", fontSize: 28, fontWeight: "900", fontFamily: "serif" },
  topSubtitle: { color: "#404943", fontSize: 12, fontWeight: "900", marginTop: 4, textTransform: "uppercase" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 22, flexWrap: "wrap" },
  notify: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  notifyDot: { position: "absolute", right: 4, top: 3, width: 7, height: 7, borderRadius: 999, backgroundColor: "#ba1a1a" },
  button: { backgroundColor: "#0f5238", borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  buttonOutline: { backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#2d6a4f" },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  buttonOutlineText: { color: "#0f5238" },
  footer: {
    marginTop: 64,
    borderTopWidth: 1,
    borderTopColor: "#d9f3e3",
    backgroundColor: "#f5f5f4",
    paddingVertical: 36,
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  footerBrand: { color: "#0f5238", fontSize: 18, fontWeight: "900" },
  footerCopy: { color: "#78716c", fontSize: 11, fontWeight: "900", textTransform: "uppercase", marginTop: 6 },
  footerLinks: { flexDirection: "row", gap: 22, flexWrap: "wrap" },
  footerLink: { color: "#78716c", fontSize: 11, textDecorationLine: "underline", textTransform: "uppercase", fontWeight: "800" },
})
