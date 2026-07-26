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
  timeout: 15000,
});

let cachedToken: string | null | undefined;

export function setAuthToken(token: string | null) {
  cachedToken = token;
}

export function clearAuthToken() {
  cachedToken = null;
}

api.interceptors.request.use(async (config) => {
  if (cachedToken === undefined) {
    cachedToken = await AsyncStorage.getItem("token");
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      cachedToken = null;
      AsyncStorage.removeItem("token").catch(() => {});
    }

    return Promise.reject(error);
  },
);

const memoryCache = new Map<string, { data: any; timestamp: number }>();

export async function fetchWithCache(url: string) {
  const cached = memoryCache.get(url);
  try {
    const res = await api.get(url);
    if (res && res.data) {
      memoryCache.set(url, { data: res.data, timestamp: Date.now() });
    }
    return res;
  } catch (err: any) {
    if (cached) {
      return { data: cached.data };
    }
    throw err;
  }
}

export function clearApiCache() {
  memoryCache.clear()
}

export default api
