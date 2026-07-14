import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { getSessionUser } from "../lib/session"

const avocadoImage =
  "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=1200&q=85"
const cemsLogo = require("../assets/cemslogo.svg")

const advantages = [
  {
    icon: "hub",
    title: "Direct Buyer Access",
    body: "Eliminate brokers and trade directly with international exporters at verified market prices.",
  },
  {
    icon: "payments",
    title: "Transparent Payments",
    body: "Automated escrow and instant settlements ensure you receive exactly what your harvest is worth.",
  },
  {
    icon: "description",
    title: "Digital Records",
    body: "A permanent ledger of every transaction, quality check, and payment milestone.",
  },
] as const

const steps = [
  ["Register", "Sign up as a farmer or cooperative with basic farm details and verification docs."],
  ["Log Yield", "Input your expected harvest volumes and variety for market visibility."],
  ["Match", "Get matched with global buyers offering the best market rates."],
  ["Get Paid", "Receive secure digital payment after quality inspection is completed."],
] as const

export default function LandingPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 900
  const isTablet = width >= 680

  const scrollRef = useRef<ScrollView>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [statsY, setStatsY] = useState(0)
  const [advantagesY, setAdvantagesY] = useState(0)
  const [stepsY, setStepsY] = useState(0)

  useEffect(() => {
    getSessionUser().then((user) => {
      if (user?.role) {
        router.replace(`/${user.role}`)
      }
    })
  }, [router])

  return (
    <SafeAreaView className="flex-1">
      <ScrollView ref={scrollRef} style={styles.page} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerShell}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={cemsLogo} style={styles.brandLogo} contentFit="contain" />
            <Text style={styles.brandText}>CEMS</Text>
          </View>

          {isTablet ? (
            <View style={styles.nav}>
              <Pressable onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>
                <Text style={[styles.navItem, styles.navActive]}>Home</Text>
              </Pressable>
              <Pressable onPress={() => scrollRef.current?.scrollTo({ y: statsY, animated: true })}>
                <Text style={styles.navItem}>Impact</Text>
              </Pressable>
              <Pressable onPress={() => scrollRef.current?.scrollTo({ y: advantagesY, animated: true })}>
                <Text style={styles.navItem}>Advantages</Text>
              </Pressable>
              <Pressable onPress={() => scrollRef.current?.scrollTo({ y: stepsY, animated: true })}>
                <Text style={styles.navItem}>How It Works</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => setMenuOpen(!menuOpen)} style={{ padding: 4 }}>
                <MaterialIcons name={menuOpen ? "close" : "menu"} size={28} color="#0f5238" />
              </Pressable>
            </View>
          )}

          <Pressable style={styles.loginButton} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginText}>Login</Text>
          </Pressable>
        </View>
        {!isTablet && menuOpen && (
          <View style={styles.mobileMenu}>
            <Pressable style={styles.mobileMenuItem} onPress={() => { scrollRef.current?.scrollTo({ y: 0, animated: true }); setMenuOpen(false); }}>
              <Text style={styles.mobileMenuText}>Home</Text>
            </Pressable>
            <Pressable style={styles.mobileMenuItem} onPress={() => { scrollRef.current?.scrollTo({ y: statsY, animated: true }); setMenuOpen(false); }}>
              <Text style={styles.mobileMenuText}>Impact</Text>
            </Pressable>
            <Pressable style={styles.mobileMenuItem} onPress={() => { scrollRef.current?.scrollTo({ y: advantagesY, animated: true }); setMenuOpen(false); }}>
              <Text style={styles.mobileMenuText}>Advantages</Text>
            </Pressable>
            <Pressable style={styles.mobileMenuItem} onPress={() => { scrollRef.current?.scrollTo({ y: stepsY, animated: true }); setMenuOpen(false); }}>
              <Text style={styles.mobileMenuText}>How It Works</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.heroBand}>
        <View style={[styles.container, styles.hero, isDesktop && styles.heroDesktop]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Empowering Kenya’s Growers</Text>
            <Text style={[styles.heroTitle, !isTablet && styles.heroTitleMobile]}>
              Fair Prices.{"\n"}Full Transparency.{"\n"}
              <Text style={styles.heroAccent}>Direct to Market.</Text>
            </Text>
            <Text style={styles.heroBody}>
              CEMS connects Kenya’s avocado farmers directly to global buyers. No middlemen,
              no manipulation, just data-driven export access.
            </Text>
            <View style={[styles.heroActions, !isTablet && styles.heroActionsMobile]}>
              <Pressable
                style={[styles.primaryButton, !isTablet && styles.fullButton]}
                onPress={() => router.push({ pathname: "/(auth)/onboarding", params: { role: "farmer" } })}
              >
                <Text style={styles.primaryButtonText}>Join as a Farmer</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, !isTablet && styles.fullButton]}
                onPress={() => router.push("/buyer")}
              >
                <Text style={styles.secondaryButtonText}>Buy Avocados</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroMediaWrap}>
            <View style={styles.heroImageCard}>
              <Image source={{ uri: avocadoImage }} style={styles.heroImage} contentFit="cover" />
            </View>
            <View style={styles.originBadge}>
              <MaterialIcons name="verified" size={22} color="#0f5238" />
              <View>
                <Text style={styles.originTitle}>Verified Origin</Text>
                <Text style={styles.originText}>Traceable from farm to container</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionWhite} onLayout={(e) => setStatsY(e.nativeEvent.layout.y)}>
        <View style={styles.container}>
          <View style={[styles.statsPanel, isTablet && styles.statsPanelWide]}>
            <View style={styles.statsIntro}>
              <Text style={styles.statsTitle}>Unprecedented Scale</Text>
              <Text style={styles.statsBody}>
                Driving economic prosperity through sustainable agricultural technology.
              </Text>
            </View>
            <View style={[styles.statsGrid, isTablet && styles.statsGridWide]}>
              <Metric value="122,000+" label="Metric Tons Exported" />
              <Metric value="KES 26B" label="Revenue in 2025" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionMuted} onLayout={(e) => setAdvantagesY(e.nativeEvent.layout.y)}>
        <View style={styles.container}>
          <SectionHeader kicker="Advantages" title="Engineered for Transparency" />
          <View style={[styles.cardGrid, isTablet && styles.cardGridTablet, isDesktop && styles.cardGridDesktop]}>
            {advantages.map((item) => (
              <View key={item.title} style={styles.featureCard}>
                <View style={styles.iconBox}>
                  <MaterialIcons name={item.icon} size={28} color="#0f5238" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionWhite} onLayout={(e) => setStepsY(e.nativeEvent.layout.y)}>
        <View style={styles.container}>
          <View style={[styles.sectionTop, isTablet && styles.sectionTopWide]}>
            <View>
              <Text style={kicker => kicker}>The Journey</Text>
              <Text style={styles.sectionTitle}>How It Works</Text>
            </View>
            {isTablet ? <Text style={styles.sectionNote}>Simple. Secure. Export-ready.</Text> : null}
          </View>
          <View style={[styles.stepGrid, isTablet && styles.stepGridTablet, isDesktop && styles.stepGridDesktop]}>
            {steps.map(([title, body], index) => (
              <View key={title} style={styles.stepCard}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepBody}>{body}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.ctaBand}>
        <View style={[styles.container, styles.ctaPanel]}>
          <Text style={styles.ctaTitle}>Ready to transform your harvest?</Text>
          <Text style={styles.ctaBody}>
            Join farmers using CEMS to access global export markets with confidence.
          </Text>
          <View style={[styles.heroActions, !isTablet && styles.heroActionsMobile]}>
            <Pressable
              style={[styles.limeButton, !isTablet && styles.fullButton]}
              onPress={() => router.push({ pathname: "/(auth)/onboarding", params: { role: "farmer" } })}
            >
              <Text style={styles.limeButtonText}>Get Started Today</Text>
            </Pressable>
            <Pressable
              style={[styles.ghostButton, !isTablet && styles.fullButton]}
              onPress={() => router.push("/buyer")}
            >
              <Text style={styles.ghostButtonText}>View Market Rates</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.container, styles.footerInner]}>
          <View style={styles.brand}>
            <Image source={cemsLogo} style={styles.footerLogo} contentFit="contain" />
            <Text style={styles.footerBrand}>CEMS KENYA</Text>
          </View>
          <Text style={styles.footerText}>Privacy Policy  |  Terms of Service  |  Export Guidelines</Text>
          <Text style={styles.footerText}>2026 CEMS Kenya. Cultivating Export Excellence.</Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.centerHeader}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fcf9f8",
  },
  scrollContent: {
    minHeight: "100%",
  },
  headerShell: {
    backgroundColor: "#fcf9f8",
    borderBottomColor: "#dcebe2",
    borderBottomWidth: 1,
  },
  header: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandLogo: {
    width: 22,
    height: 22,
  },
  brandText: {
    color: "#0f5238",
    fontSize: 22,
    fontWeight: "900",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  navItem: {
    color: "#605f50",
    fontSize: 15,
    fontWeight: "700",
  },
  navActive: {
    color: "#0f5238",
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#0f5238",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  loginText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  container: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  heroBand: {
    backgroundColor: "#eef7f0",
  },
  hero: {
    paddingTop: 44,
    paddingBottom: 56,
    gap: 34,
  },
  heroDesktop: {
    minHeight: 720,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCopy: {
    flex: 1,
    maxWidth: 560,
  },
  eyebrow: {
    color: "#0f5238",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  heroTitle: {
    color: "#1b1b1b",
    fontSize: 48,
    lineHeight: 58,
    fontWeight: "900",
    marginBottom: 18,
  },
  heroTitleMobile: {
    fontSize: 36,
    lineHeight: 43,
  },
  heroAccent: {
    color: "#0f5238",
    fontStyle: "italic",
  },
  heroBody: {
    color: "#404943",
    fontSize: 17,
    lineHeight: 27,
    maxWidth: 540,
    marginBottom: 28,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  heroActionsMobile: {
    alignItems: "stretch",
  },
  primaryButton: {
    backgroundColor: "#0f5238",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    borderColor: "#0f5238",
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0f5238",
    fontSize: 16,
    fontWeight: "900",
  },
  fullButton: {
    width: "100%",
  },
  heroMediaWrap: {
    flex: 1,
    minHeight: 340,
    justifyContent: "center",
  },
  heroImageCard: {
    backgroundColor: "#ffffff",
    borderRadius: 34,
    padding: 10,
    shadowColor: "#0f5238",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 26,
    backgroundColor: "#dcebe2",
  },
  originBadge: {
    alignSelf: "flex-start",
    marginTop: -34,
    marginLeft: 18,
    backgroundColor: "#ffffff",
    borderColor: "#dcebe2",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#0f5238",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  originTitle: {
    color: "#0f5238",
    fontWeight: "900",
  },
  originText: {
    color: "#404943",
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  sectionWhite: {
    backgroundColor: "#ffffff",
    paddingVertical: 56,
  },
  sectionMuted: {
    backgroundColor: "#f6f3f2",
    paddingVertical: 56,
  },
  statsPanel: {
    backgroundColor: "#0f5238",
    borderRadius: 24,
    padding: 26,
    gap: 28,
  },
  statsPanelWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 44,
  },
  statsIntro: {
    flex: 1,
  },
  statsTitle: {
    color: "#ffffff",
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "900",
    marginBottom: 10,
  },
  statsBody: {
    color: "#b1f0ce",
    fontSize: 16,
    lineHeight: 25,
  },
  statsGrid: {
    gap: 22,
  },
  statsGridWide: {
    flex: 1,
    flexDirection: "row",
  },
  metric: {
    borderLeftColor: "#a3e635",
    borderLeftWidth: 3,
    paddingLeft: 16,
    minWidth: 180,
  },
  metricValue: {
    color: "#a3e635",
    fontSize: 34,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#e9fff2",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  centerHeader: {
    alignItems: "center",
    marginBottom: 34,
  },
  kicker: {
    color: "#0f5238",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#1b1b1b",
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "900",
    textAlign: "center",
  },
  cardGrid: {
    gap: 18,
  },
  cardGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardGridDesktop: {
    flexWrap: "nowrap",
  },
  featureCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "#ffffff",
    borderColor: "#e0eee5",
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    shadowColor: "#0f5238",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#b1f0ce",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  cardTitle: {
    color: "#1b1b1b",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginBottom: 10,
  },
  cardBody: {
    color: "#404943",
    fontSize: 15,
    lineHeight: 23,
  },
  sectionTop: {
    marginBottom: 34,
    gap: 12,
  },
  sectionTopWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionNote: {
    color: "#605f50",
    fontSize: 16,
    fontWeight: "700",
  },
  stepGrid: {
    gap: 20,
  },
  stepGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  stepGridDesktop: {
    flexWrap: "nowrap",
  },
  stepCard: {
    flex: 1,
    minWidth: 210,
    paddingVertical: 12,
  },
  stepNumber: {
    color: "#e3f5eb",
    fontSize: 86,
    lineHeight: 90,
    fontWeight: "900",
    marginBottom: -24,
  },
  stepTitle: {
    color: "#0f5238",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  stepBody: {
    color: "#404943",
    fontSize: 15,
    lineHeight: 23,
  },
  ctaBand: {
    backgroundColor: "#2d6a4f",
    paddingVertical: 52,
  },
  ctaPanel: {
    alignItems: "center",
  },
  ctaTitle: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaBody: {
    color: "#b1f0ce",
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    maxWidth: 650,
    marginBottom: 26,
  },
  limeButton: {
    backgroundColor: "#a3e635",
    borderRadius: 999,
    paddingHorizontal: 26,
    paddingVertical: 15,
    alignItems: "center",
  },
  limeButtonText: {
    color: "#0f5238",
    fontWeight: "900",
    fontSize: 16,
  },
  ghostButton: {
    borderColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 26,
    paddingVertical: 15,
    alignItems: "center",
  },
  ghostButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
  footer: {
    backgroundColor: "#f0eded",
    borderTopColor: "#dcebe2",
    borderTopWidth: 1,
    paddingVertical: 28,
  },
  footerInner: {
    alignItems: "center",
    gap: 12,
  },
  footerBrand: {
    color: "#0f5238",
    fontWeight: "900",
    letterSpacing: 1,
  },
  footerLogo: {
    width: 18,
    height: 18,
  },
  footerText: {
    color: "#605f50",
    fontSize: 11,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  mobileMenu: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#dcebe2",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  mobileMenuItem: {
    paddingVertical: 12,
    borderBottomColor: "#f0eded",
    borderBottomWidth: 1,
  },
  mobileMenuText: {
    color: "#0f5238",
    fontSize: 16,
    fontWeight: "700",
  },
})
