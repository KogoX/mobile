import React, { useState, useCallback, useRef } from "react"
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import api from "../lib/api"
import { notifyNewListing } from "../lib/notifications"

type AppNotification = {
  id: string
  title: string
  message: string
  is_read: boolean
  target_url?: string | null
  created_at: string
}

export default function NotificationBell({ color = "#0f5238" }: { color?: string }) {
  const router = useRouter()
  const [modalVisible, setModalVisible] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  
  const lastKnownUnreadCount = useRef(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications")
      setNotifications(data)

      const unreadCount = data.filter((n: AppNotification) => !n.is_read).length
      
      // If unread count went up, it means there are new notifications.
      if (unreadCount > lastKnownUnreadCount.current && data.length > 0) {
        // Trigger a local push notification popup for the most recent one
        const newestUnread = data.find((n: AppNotification) => !n.is_read)
        if (newestUnread) {
          notifyNewListing(newestUnread.title, newestUnread.message)
        }
      }
      
      lastKnownUnreadCount.current = unreadCount
    } catch (error) {
      // Silently fail polling
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }, [fetchNotifications])
  )

  const handleOpen = async () => {
    setModalVisible(true)
    
    const unreadCount = notifications.filter(n => !n.is_read).length
    if (unreadCount > 0) {
      try {
        await api.put("/notifications/read")
        // Optimistically mark all as read locally
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        lastKnownUnreadCount.current = 0
      } catch (error) {
        console.error("Failed to mark notifications as read:", error)
      }
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <>
      <Pressable onPress={handleOpen} style={styles.iconButton}>
        <MaterialIcons name="notifications" size={26} color={color} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <Text style={styles.title}>Notifications</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="notifications-none" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No notifications yet.</Text>
                </View>
              ) : (
                notifications.map((n) => (
                  <Pressable 
                    key={n.id} 
                    style={[styles.notificationCard, !n.is_read && styles.unreadCard]}
                    onPress={() => {
                      setModalVisible(false)
                      if (n.target_url) {
                        router.push(n.target_url as any)
                      }
                    }}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{n.title}</Text>
                      {!n.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardMessage}>{n.message}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(n.created_at).toLocaleString()}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
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
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FCF9F8",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 70,
    paddingRight: 20,
    paddingLeft: 20,
  },
  modalContent: {
    backgroundColor: "#f9fafb",
    borderRadius: 24,
    width: 340,
    maxWidth: "100%",
    maxHeight: "70%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1f2937",
  },
  closeBtn: {
    padding: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  notificationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  unreadCard: {
    backgroundColor: "#f4fbf7",
    borderColor: "#dcebe2",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0f5238",
    marginLeft: 8,
  },
  cardMessage: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#9ca3af",
  }
})
