import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import Constants from "expo-constants"
import { Platform } from "react-native"

const explicitUrl = process.env.EXPO_PUBLIC_API_URL
const extraUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined
const expoHostUri = Constants.expoConfig?.hostUri
const inferredLocalUrl = expoHostUri ? `http://${expoHostUri.split(":")[0]}:5000` : undefined

// Priority: explicit env override > Expo dev host IP > app.json extra > emulator/host loopback > localhost
const configuredUrl =
  explicitUrl ||
  inferredLocalUrl ||
  extraUrl ||
  (Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000")

const normalizedBase = configuredUrl.startsWith("http") ? configuredUrl : `http://${configuredUrl}`

console.log(`[api] backend base URL resolved to: ${normalizedBase}`)

const api = axios.create({
  baseURL: `${normalizedBase.replace(/\/$/, "")}/api`,
  timeout: 15000
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response && error.message === "Network Error") {
      console.warn(
        `[api] Network Error - cannot reach ${api.defaults.baseURL}. ` +
          `Is the backend running? If on an emulator/device, set EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g. http://192.168.x.x:5000).`
      )
    }
    return Promise.reject(error)
  }
)

export default api
