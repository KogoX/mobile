import { MaterialIcons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { ManagerFooter, ManagerLayout } from "../../components/ManagerLayout"

const personal = [
  ["Full Legal Name", "Samuel Kamau Njoroge"],
  ["Phone Number", "+254 712 345 678"],
  ["Email Address", "skamau@example.com"],
  ["Registered Village", "Githunguri, Kiambu County"],
]

const farm = [
  ["Total Acreage", "4.5 Acres"],
  ["Number of Trees", "850 Active"],
  ["Primary Crop Type", "Hass Avocado"],
  ["Farm Coordinates", "-1.0333, 36.7833"],
]

const docs = [
  ["National ID", "Front and back scan verified by authorities.", "Verified", "badge"],
  ["Title Deed", "Proof of land ownership currently under review.", "Pending Review", "description"],
]

export default function ManagerSettings() {
  const { width } = useWindowDimensions()
  const desktop = width >= 980

  return (
    <ManagerLayout active="Settings">
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Profile & Settings</Text>
            <Text style={styles.subtitle}>Manage personal information and farm documentation.</Text>
          </View>
          <View style={styles.editButton}>
            <MaterialIcons name="edit" size={17} color="#ffffff" />
            <Text style={styles.editText}>Edit Profile</Text>
          </View>
        </View>

        <View style={[styles.cardGrid, desktop && styles.cardGridDesktop]}>
          <DetailCard icon="person" title="Personal Details" items={personal} />
          <DetailCard icon="terrain" title="Farm Details" items={farm} />
        </View>

        <View style={styles.docsSection}>
          <View style={styles.sectionHead}>
            <MaterialIcons name="verified-user" size={22} color="#07543b" />
            <Text style={styles.sectionTitle}>Compliance Documents</Text>
          </View>
          <View style={[styles.docsGrid, desktop && styles.docsGridDesktop]}>
            {docs.map(([title, copy, status, icon]) => (
              <View key={title} style={styles.docCard}>
                <View style={styles.docTop}>
                  <View style={styles.docIcon}>
                    <MaterialIcons name={icon as never} size={21} color="#0f8a5f" />
                  </View>
                  <Text style={[styles.docStatus, status !== "Verified" && styles.docPending]}>{status}</Text>
                </View>
                <Text style={styles.docTitle}>{title}</Text>
                <Text style={styles.docCopy}>{copy}</Text>
                <Text style={styles.docLink}>{status === "Verified" ? "View Document ->" : "Replace File ->"}</Text>
              </View>
            ))}
          </View>
        </View>

        <ManagerFooter />
      </ScrollView>
    </ManagerLayout>
  )
}

function DetailCard({ icon, title, items }: { icon: string; title: string; items: string[][] }) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.cardTitleRow}>
        <View style={styles.cardIcon}>
          <MaterialIcons name={icon as never} size={20} color="#0f8a5f" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.itemGrid}>
        {items.map(([label, value]) => (
          <View key={label} style={styles.item}>
            <Text style={styles.itemLabel}>{label}</Text>
            <Text style={styles.itemValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { padding: 32, backgroundColor: "#fcf9f8" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { color: "#163c2d", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#66736d", marginTop: 6, fontWeight: "700" },
  editButton: { backgroundColor: "#07543b", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  editText: { color: "#ffffff", fontWeight: "900" },
  cardGrid: { gap: 20, marginTop: 34 },
  cardGridDesktop: { flexDirection: "row" },
  detailCard: { flex: 1, minWidth: 300, minHeight: 250, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 26 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 34, height: 34, borderRadius: 999, backgroundColor: "#e5f6ec", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#07543b", fontSize: 20, fontWeight: "900" },
  itemGrid: { marginTop: 24, gap: 18 },
  item: { gap: 5 },
  itemLabel: { color: "#5f6b65", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  itemValue: { color: "#221816", fontSize: 15, fontWeight: "900" },
  docsSection: { marginTop: 34 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { color: "#07543b", fontSize: 24, fontWeight: "900" },
  docsGrid: { gap: 16, marginTop: 18 },
  docsGridDesktop: { flexDirection: "row" },
  docCard: { width: 270, maxWidth: "100%", backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#ebe6e4", padding: 22 },
  docTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  docIcon: { width: 40, height: 40, borderRadius: 999, backgroundColor: "#e5f6ec", alignItems: "center", justifyContent: "center" },
  docStatus: { color: "#0f8a5f", backgroundColor: "#d5f8df", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 10, fontWeight: "900", overflow: "hidden" },
  docPending: { color: "#5f625f", backgroundColor: "#f1eee8" },
  docTitle: { color: "#163c2d", fontSize: 16, fontWeight: "900", marginTop: 18 },
  docCopy: { color: "#53675d", marginTop: 8, lineHeight: 19, fontWeight: "700" },
  docLink: { color: "#07543b", marginTop: 16, fontWeight: "900" },
})
