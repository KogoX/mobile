import { Redirect, Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react"

import { getSessionUser } from "../../lib/session"

export default function ManagerLayout() {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    getSessionUser().then((user) => {
      setAllowed(Boolean(user && user.role === "manager"))
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
        name="farmers"
        options={{
          title: "Farmers",
          tabBarIcon: ({ color }) => <MaterialIcons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <MaterialIcons name="shopping-cart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payouts"
        options={{
          title: "Payouts",
          tabBarIcon: ({ color }) => <MaterialIcons name="payments" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
