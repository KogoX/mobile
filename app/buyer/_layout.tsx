import { Redirect, Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react"

import { getSessionUser } from "../../lib/session"

export default function BuyerLayout() {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    getSessionUser().then((user) => {
      setAllowed(Boolean(user && user.role === "buyer"))
    })
  }, [])

  if (allowed === null) return null
  if (!allowed) return <Redirect href="/(auth)/login" />

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#2A5C43" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          tabBarIcon: ({ color }) => <MaterialIcons name="storefront" size={24} color={color} />,
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
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
