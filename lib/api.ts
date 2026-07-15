import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import Constants from "expo-constants"
import { Platform } from "react-native"

const explicitUrl = process.env.EXPO_PUBLIC_API_URL
const extraUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined
const expoHostUri = Constants.expoConfig?.hostUri
const inferredLocalUrl = expoHostUri ? `http://${expoHostUri.split(":")[0]}:5000` : undefined

// Priority: explicit env override > Expo dev host IP > app.json extra > emulator/host loopback > localhost
let configuredUrl =
  explicitUrl ||
  inferredLocalUrl ||
  extraUrl ||
  (Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000")

if (Platform.OS === "web" && typeof window !== "undefined") {
  configuredUrl = `http://${window.location.hostname}:5000`
}

const normalizedBase = configuredUrl.startsWith("http") ? configuredUrl : `http://${configuredUrl}`

console.log(`[api] backend base URL resolved to: ${normalizedBase}`)

const api = axios.create({
  baseURL: `${normalizedBase.replace(/\/$/, "")}/api`,
  timeout: 15000
})

let cachedToken: string | null | undefined

export function setAuthToken(token: string | null) {
  cachedToken = token
}

export function clearAuthToken() {
  cachedToken = null
}

api.interceptors.request.use(async (config) => {
  if (cachedToken === undefined) {
    cachedToken = await AsyncStorage.getItem("token")
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`
  }
  return config
})

const SUPPRESS_MS = 30_000
let _lastNetworkErrorLog = 0

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError =
      !error.response &&
      (error.message === "Network Error" || error.code === "ECONNABORTED")

    if (isNetworkError) {
      const now = Date.now()
      if (now - _lastNetworkErrorLog >= SUPPRESS_MS) {
        _lastNetworkErrorLog = now
        console.warn(
          `[api] Network Error — cannot reach ${api.defaults.baseURL}.\n` +
          `  • Is the backend running?\n` +
          `  • On a device/emulator, update EXPO_PUBLIC_API_URL in mobile/.env to your machine's LAN IP.\n` +
          `  • Current value: ${normalizedBase}\n` +
          `  (Further network errors will be suppressed for 30 s)`
        )
      }
    }
    return Promise.reject(error)
  }
)

export default api
