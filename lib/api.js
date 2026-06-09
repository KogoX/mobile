import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const api = axios.create({
  baseURL: "10.137.42.225:5000/api",
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api