import AsyncStorage from "@react-native-async-storage/async-storage"

export type Role = "farmer" | "manager" | "buyer"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string | null
  location?: string | null
}

export async function saveSession(token: string, user: SessionUser) {
  await AsyncStorage.multiSet([
    ["token", token],
    ["user", JSON.stringify(user)]
  ])
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
  await AsyncStorage.multiRemove(["token", "user"])
}
