import { Redirect, Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react"

import { getSessionUser } from "../../lib/session"

export default function FarmerLayout() {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    getSessionUser().then((user) => {
      setAllowed(Boolean(user && user.role === "farmer"))
    })
  }, [])

  if (allowed === null) return null
  if (!allowed) return <Redirect href="/(auth)/login" />

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#2A5C43" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log-yield"
        options={{
          title: "Log Yield",
          tabBarIcon: ({ color }) => <MaterialIcons name="add-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color }) => <MaterialIcons name="account-balance-wallet" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
