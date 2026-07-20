import AsyncStorage from "@react-native-async-storage/async-storage"
import * as LocalAuthentication from "expo-local-authentication"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

import { clearAuthToken, setAuthToken } from "./api"

export type Role = "farmer" | "manager" | "buyer"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string | null
  location?: string | null
  unique_id?: string | null
}

export async function saveSession(token: string, user: SessionUser) {
  setAuthToken(token)
  await AsyncStorage.multiSet([
    ["token", token],
    ["user", JSON.stringify(user)]
  ])
}

const biometricTokenKey = "biometricToken"
const biometricUserKey = "biometricUser"

export async function canUseBiometrics() {
  if (Platform.OS === "web") return false

  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync()
  ])

  return hasHardware && enrolled
}

export async function enableBiometricSignIn(token: string, user: SessionUser) {
  if (Platform.OS === "web") return
  await SecureStore.setItemAsync(biometricTokenKey, token)
  await SecureStore.setItemAsync(biometricUserKey, JSON.stringify(user))
}

export async function disableBiometricSignIn() {
  if (Platform.OS === "web") return
  await SecureStore.deleteItemAsync(biometricTokenKey)
  await SecureStore.deleteItemAsync(biometricUserKey)
}

export async function isBiometricSignInEnabled() {
  if (Platform.OS === "web") return false
  const token = await SecureStore.getItemAsync(biometricTokenKey)
  return Boolean(token)
}

export async function signInWithBiometrics() {
  const available = await canUseBiometrics()
  if (!available) {
    throw new Error("No fingerprint or face unlock is enrolled on this phone.")
  }

  const token = await SecureStore.getItemAsync(biometricTokenKey)
  const rawUser = await SecureStore.getItemAsync(biometricUserKey)

  if (!token || !rawUser) {
    throw new Error("Biometric sign in is not enabled for this account.")
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Sign in to CEMS",
    fallbackLabel: "Use passcode",
    cancelLabel: "Cancel"
  })

  if (!result.success) {
    throw new Error("Biometric authentication was cancelled or failed.")
  }

  const user = JSON.parse(rawUser) as SessionUser
  await saveSession(token, user)
  return user
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = await AsyncStorage.getItem("user")
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export async function clearSession() {
  clearAuthToken()
  await AsyncStorage.multiRemove(["token", "user"])
}
