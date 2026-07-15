import { MaterialIcons } from "@expo/vector-icons"
import { useEffect, useRef } from "react"
import { Animated, Text, View } from "react-native"

type ToastType = "success" | "error" | "info"

type ToastMessage = {
  text: string
  type: ToastType
}

const ICONS: Record<ToastType, keyof typeof MaterialIcons.glyphMap> = {
  success: "check-circle",
  error: "error",
  info: "info"
}

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "#E7F5EE", border: "#2A5C43", text: "#145232", icon: "#2A5C43" },
  error: { bg: "#FEE2E2", border: "#DC2626", text: "#991B1B", icon: "#DC2626" },
  info: { bg: "#DBEAFE", border: "#2563EB", text: "#1E40AF", icon: "#2563EB" }
}

export function Toast({ message, onDone }: { message: ToastMessage | null; onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-40)).current

  useEffect(() => {
    if (!message) return

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start()

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -40, duration: 250, useNativeDriver: true })
      ]).start(() => onDone())
    }, 3000)

    return () => clearTimeout(timer)
  }, [message, onDone, opacity, translateY])

  if (!message) return null

  const colors = COLORS[message.type]

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        opacity,
        transform: [{ translateY }]
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.bg,
          borderLeftWidth: 4,
          borderLeftColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 6,
          gap: 12
        }}
      >
        <MaterialIcons name={ICONS[message.type]} size={22} color={colors.icon} />
        <Text style={{ flex: 1, color: colors.text, fontWeight: "800", fontSize: 14 }}>
          {message.text}
        </Text>
      </View>
    </Animated.View>
  )
}

/** Generates a short 10-character alphanumeric hash from a UUID or any string */
export function shortHash(id: string | number): string {
  const str = String(id)
  // If it looks like a UUID, strip dashes and take first 10 chars (uppercased)
  const clean = str.replace(/[^a-zA-Z0-9]/g, "")
  return clean.slice(0, 10).toUpperCase()
}
