import { Platform } from "react-native"

type ExpoNotifications = {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldPlaySound: boolean
      shouldSetBadge: boolean
      shouldShowBanner: boolean
      shouldShowList: boolean
    }>
  }) => void
  getPermissionsAsync: () => Promise<{ status: string }>
  requestPermissionsAsync: () => Promise<{ status: string }>
  scheduleNotificationAsync: (request: {
    content: { title: string; body: string }
    trigger: null
  }) => Promise<string>
}

async function loadNotifications(): Promise<ExpoNotifications | null> {
  if (Platform.OS === "web") return null

  try {
    const runtimeRequire = eval("require") as (name: string) => ExpoNotifications
    const notifications = runtimeRequire("expo-notifications")
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      })
    })
    return notifications
  } catch {
    return null
  }
}

export async function ensureNotificationsReady() {
  const notifications = await loadNotifications()
  if (!notifications) return false

  const current = await notifications.getPermissionsAsync()
  const finalStatus =
    current.status === "granted"
      ? current.status
      : (await notifications.requestPermissionsAsync()).status

  return finalStatus === "granted"
}

export async function notifyNewListing(title: string, body: string) {
  const notifications = await loadNotifications()
  if (!notifications) return

  const ready = await ensureNotificationsReady()
  if (!ready) return

  await notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null
  })
}
