import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native"

type Role = "farmer" | "manager" | "buyer"

const roles: Role[] = ["farmer", "manager", "buyer"]
const logo = require("../../assets/cemslogo.svg")

export default function LoginScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [role, setRole] = useState<Role>("farmer")
  const [remember, setRemember] = useState(false)
  const isWide = width >= 760

  const signIn = () => router.replace(`/${role}`)

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={[styles.card, isWide && styles.cardWide]}>
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logo} contentFit="contain" />
        </View>

        <Text style={styles.title}>CEMS Avocado Cooperative</Text>
        <Text style={styles.subtitle}>Cooperative Export Management System</Text>

        <Text style={styles.roleLabel}>Select Role</Text>
        <View style={styles.roleRow}>
          {roles.map((item) => {
            const active = item === role
            return (
              <Pressable
                key={item}
                style={[styles.roleChip, active && styles.roleChipActive]}
                onPress={() => setRole(item)}
              >
                <Text style={[styles.roleText, active && styles.roleTextActive]}>
                  {item[0].toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Field
          label="Email Address"
          icon="mail-outline"
          placeholder="Enter your email"
          keyboardType="email-address"
        />
        <Field label="Password" icon="lock-outline" placeholder="Enter your password" secureTextEntry />

        <View style={styles.loginMeta}>
          <Pressable style={styles.checkLine} onPress={() => setRemember((value) => !value)}>
            <View style={[styles.checkbox, remember && styles.checkboxActive]}>
              {remember ? <MaterialIcons name="check" size={16} color="#ffffff" /> : null}
            </View>
            <Text style={styles.metaText}>Remember me</Text>
          </Pressable>
          <Pressable>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={signIn}>
          <Text style={styles.primaryText}>Sign In</Text>
        </Pressable>

        <View style={styles.footerPrompt}>
          <Text style={styles.promptText}>Don't have an account?</Text>
          <Pressable onPress={() => router.push({ pathname: "/(auth)/onboarding", params: { role } })}>
            <Text style={styles.promptLink}>Create your {role} profile</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

function Field({
  label,
  icon,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string
  icon: keyof typeof MaterialIcons.glyphMap
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: "default" | "email-address"
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <MaterialIcons name={icon} size={25} color="#707973" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#697386"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },
  content: {
    minHeight: "100%",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 26,
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  cardWide: {
    padding: 44,
  },
  logoWrap: {
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#f6f3f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  logo: {
    width: 42,
    height: 42,
  },
  title: {
    color: "#0f5238",
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#605f50",
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center",
    marginBottom: 44,
  },
  roleLabel: {
    color: "#313030",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  roleChip: {
    flex: 1,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: "#f0eded",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  roleChipActive: {
    backgroundColor: "#2d6a4f",
  },
  roleText: {
    color: "#313030",
    fontSize: 18,
    fontWeight: "800",
  },
  roleTextActive: {
    color: "#ffffff",
  },
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: "#313030",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 9,
  },
  inputShell: {
    minHeight: 70,
    borderColor: "#e5e2e1",
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "#fcf9f8",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  input: {
    flex: 1,
    color: "#1b1b1b",
    fontSize: 18,
    outlineStyle: "none" as never,
  },
  loginMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
    marginBottom: 28,
  },
  checkLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderColor: "#707973",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#2d6a4f",
    borderColor: "#2d6a4f",
  },
  metaText: {
    color: "#605f50",
    fontSize: 16,
  },
  forgotText: {
    color: "#0f5238",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  footerPrompt: {
    alignItems: "center",
    gap: 8,
  },
  promptText: {
    color: "#605f50",
    fontSize: 18,
  },
  promptLink: {
    color: "#0f5238",
    fontSize: 17,
    fontWeight: "900",
  },
})
