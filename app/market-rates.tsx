import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const rates = [
  {
    id: "hass",
    variety: "Hass Avocado",
    price: 135.5,
    unit: "KES / kg",
    trend: "+4.2%",
    isUp: true,
    grade: "Export Grade A",
    demand: "Very High",
    desc: "Premium quality for European markets. High demand due to off-season in other producing countries."
  },
  {
    id: "fuerte",
    variety: "Fuerte Avocado",
    price: 85.0,
    unit: "KES / kg",
    trend: "-1.5%",
    isUp: false,
    grade: "Export Grade A",
    demand: "Stable",
    desc: "Strong regional demand. Excellent for processing and local fresh markets."
  },
  {
    id: "jumbo",
    variety: "Jumbo (Mixed)",
    price: 155.0,
    unit: "KES / kg",
    trend: "+2.8%",
    isUp: true,
    grade: "Premium Selection",
    demand: "High",
    desc: "Specially selected oversized fruits catering to niche gourmet markets."
  },
]

export default function MarketRates() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f5238" />
        </Pressable>
        <Text style={styles.headerTitle}>Live Market Rates</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[styles.heroBand, { backgroundColor: "#0f5238" }]}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>MARKET INDEX - KENYA</Text>
            <Text style={styles.heroTitle}>Export Prices at a Glance</Text>
            <Text style={styles.heroDesc}>
              Real-time indicative pricing based on global demand and local supply volumes. Updated today.
            </Text>
          </View>
        </View>

        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <View style={styles.updatePill}>
            <MaterialIcons name="sync" size={16} color="#0f5238" />
            <Text style={styles.updateText}>Last synced: Just now</Text>
          </View>

          <View style={styles.cardsGrid}>
            {rates.map((rate) => (
              <View key={rate.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.varietyTitle}>{rate.variety}</Text>
                    <Text style={styles.gradeText}>{rate.grade}</Text>
                  </View>
                  <View style={[styles.trendPill, rate.isUp ? styles.trendUp : styles.trendDown]}>
                    <MaterialIcons 
                      name={rate.isUp ? "trending-up" : "trending-down"} 
                      size={16} 
                      color={rate.isUp ? "#15803d" : "#b91c1c"} 
                    />
                    <Text style={[styles.trendText, rate.isUp ? styles.trendTextUp : styles.trendTextDown]}>
                      {rate.trend}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceValue}>{rate.price.toFixed(1)}</Text>
                  <Text style={styles.priceUnit}>{rate.unit}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.demandRow}>
                  <Text style={styles.demandLabel}>Current Demand:</Text>
                  <Text style={[styles.demandValue, { color: rate.demand.includes("High") ? "#15803d" : "#0f5238" }]}>
                    {rate.demand}
                  </Text>
                </View>

                <Text style={styles.descText}>{rate.desc}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>Ready to sell at these rates?</Text>
            <Text style={styles.ctaDesc}>Create a farmer account to log your yields and get matched with buyers.</Text>
            <Pressable 
              style={styles.ctaButton}
              onPress={() => router.push({ pathname: "/(auth)/onboarding", params: { role: "farmer" } })}
            >
              <Text style={styles.ctaButtonText}>Get Started Now</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fcf9f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f5238",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBand: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    maxWidth: 600,
    alignSelf: "center",
    alignItems: "center",
  },
  heroEyebrow: {
    color: "#a3e635",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  heroDesc: {
    color: "#dcebe2",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  container: {
    paddingHorizontal: 20,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  containerTablet: {
    maxWidth: 800,
  },
  updatePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#dcebe2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    marginTop: -20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  updateText: {
    color: "#0f5238",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  cardsGrid: {
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f5238",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  varietyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1f2937",
  },
  gradeText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
    marginTop: 2,
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  trendUp: {
    backgroundColor: "#dcfce7",
  },
  trendDown: {
    backgroundColor: "#fee2e2",
  },
  trendText: {
    fontSize: 13,
    fontWeight: "800",
  },
  trendTextUp: {
    color: "#15803d",
  },
  trendTextDown: {
    color: "#b91c1c",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 16,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f5238",
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 16,
  },
  demandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  demandLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  demandValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4b5563",
  },
  ctaBox: {
    backgroundColor: "#eef7f0",
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dcebe2",
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f5238",
    textAlign: "center",
    marginBottom: 8,
  },
  ctaDesc: {
    fontSize: 15,
    color: "#404943",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: "#0f5238",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 99,
    width: "100%",
    alignItems: "center",
  },
  ctaButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  }
})
