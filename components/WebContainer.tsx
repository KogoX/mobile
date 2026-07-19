import React from "react"
import { Platform, useWindowDimensions, View } from "react-native"

export default function WebContainer({ children, bg = "#FCF9F8" }: { children: React.ReactNode, bg?: string }) {
  const { width } = useWindowDimensions()
  const isWebWide = Platform.OS === "web" && width > 600

  if (!isWebWide) {
    return <View style={{ flex: 1, backgroundColor: bg }}>{children}</View>
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#dcebe2", alignItems: "center" }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 480,
          backgroundColor: bg,
          shadowColor: "#0f5238",
          shadowOpacity: 0.15,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 10 },
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  )
}
