import React, { useState, useEffect } from "react"
import { View, Text, Pressable, Modal, StyleSheet, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "sw", name: "Swahili" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "ar", name: "العربية" }
]

export default function LanguageSelector({ color = "#0f5238" }: { color?: string }) {
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedLang, setSelectedLang] = useState("en")

  useEffect(() => {
    AsyncStorage.getItem("app_language").then((lang) => {
      if (lang) setSelectedLang(lang)
    })
  }, [])

  const handleSelect = async (code: string, name: string) => {
    await AsyncStorage.setItem("app_language", code)
    setSelectedLang(code)
    setModalVisible(false)
    Alert.alert("Language Updated", `App language set to ${name}. Translations will apply in future updates.`)
  }

  return (
    <>
      <Pressable onPress={() => setModalVisible(true)} style={styles.iconButton}>
        <MaterialIcons name="language" size={24} color={color} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Language</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.list}>
              {LANGUAGES.map((lang) => {
                const isActive = selectedLang === lang.code
                return (
                  <Pressable
                    key={lang.code}
                    style={[styles.langItem, isActive && styles.langItemActive]}
                    onPress={() => handleSelect(lang.code, lang.name)}
                  >
                    <Text style={[styles.langText, isActive && styles.langTextActive]}>
                      {lang.name}
                    </Text>
                    {isActive && (
                      <MaterialIcons name="check-circle" size={20} color="#0f5238" />
                    )}
                  </Pressable>
                )
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 360,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1f2937",
  },
  list: {
    gap: 8,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  langItemActive: {
    backgroundColor: "#eef7f0",
    borderColor: "#dcebe2",
    borderWidth: 1,
  },
  langText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  langTextActive: {
    color: "#0f5238",
    fontWeight: "800",
  },
})
