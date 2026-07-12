import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import Constants from "expo-constants"

const configuredUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  "http://localhost:5000"

const normalizedBase = configuredUrl.startsWith("http") ? configuredUrl : `http://${configuredUrl}`

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

export default api