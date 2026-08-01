import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api, { clearApiCache, fetchWithCache } from "../../lib/api";
import { useFocusRefresh } from "../../lib/polling";
import { Toast } from "../../components/Toast";
import type { Role } from "../../lib/session";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  location?: string | null;
  status: string;
  created_at: string;
  unique_id?: string | null;
  payment_details?: string | null;
};

type ToastMsg = { text: string; type: "success" | "error" | "info" } | null;

const filters: Array<Role | "all"> = ["all", "farmer", "buyer", "manager"];

export default function ManagerUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeFilter, setActiveFilter] = useState<Role | "all">("all");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastMsg>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Register Farmer Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    payment_details: "",
    password: "",
  });

  const loadFromCache = useCallback(() => {
    AsyncStorage.getItem("manager_users_cache").then((cached) => {
      if (cached) {
        try {
          setUsers(JSON.parse(cached));
        } catch {}
      }
    });
  }, []);

  // Instant 0ms hydration on mount & tab focus
  useFocusEffect(
    useCallback(() => {
      loadFromCache();
      refresh();
    }, [loadFromCache]),
  );

  function showToast(
    text: string,
    type: "success" | "error" | "info" = "success",
  ) {
    setToast({ text, type });
  }

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
      clearApiCache();
    }
    try {
      const { data } = await fetchWithCache("/auth/users", {
        preferCache: !isManual,
        onFreshData: (freshData) => {
          if (Array.isArray(freshData)) {
            setUsers(freshData);
            AsyncStorage.setItem("manager_users_cache", JSON.stringify(freshData)).catch(
              () => {},
            );
          }
        },
      });
      if (Array.isArray(data)) {
        setUsers(data);
        AsyncStorage.setItem("manager_users_cache", JSON.stringify(data)).catch(
          () => {},
        );
      }
    } catch (error) {
      console.warn("Failed to load users:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusRefresh(refresh);

  function updateNewFarmer(field: keyof typeof newFarmer, value: string) {
    setNewFarmer((current) => ({ ...current, [field]: value }));
  }

  function resetCreateForm() {
    setNewFarmer({
      name: "",
      email: "",
      phone: "",
      location: "",
      payment_details: "",
      password: "",
    });
  }

  async function createFarmer() {
    if (!newFarmer.name.trim() || !newFarmer.password.trim()) {
      showToast("Name and temporary password are required.", "error");
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post("/auth/farmers", {
        name: newFarmer.name.trim(),
        email: newFarmer.email.trim(),
        phone: newFarmer.phone.trim(),
        location: newFarmer.location.trim(),
        payment_details: newFarmer.payment_details.trim(),
        password: newFarmer.password,
      });
      setUsers((current) => [data, ...current]);
      setShowCreate(false);
      resetCreateForm();
      showToast(`${data.name} registered successfully.`);
      Alert.alert(
        "Farmer Registered ✓",
        `Login email: ${data.email}\nTemporary password: ${newFarmer.password}`,
      );
      await refresh();
    } catch (err: any) {
      showToast(
        err?.response?.data?.error ||
          err.message ||
          "Registration failed. Please check inputs.",
        "error",
      );
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(user: User, status: string) {
    Alert.alert(
      "Confirm Status Update",
      `Set status for ${user.name} to ${status}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text:
            status === "Active"
              ? "Verify"
              : status === "Suspended"
                ? "Suspend"
                : "Set Pending",
          style: status === "Suspended" ? "destructive" : "default",
          onPress: async () => {
            setUpdatingId(user.id);
            try {
              await api.patch(`/auth/users/${user.id}/status`, { status });
              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, status } : u)),
              );
              showToast(
                status === "Active"
                  ? `${user.name} verified`
                  : status === "Suspended"
                    ? `${user.name} suspended`
                    : `${user.name} set to pending`,
                status === "Suspended" ? "error" : "success",
              );
            } catch (err: any) {
              showToast(
                err?.response?.data?.error || err.message || "Update failed",
                "error",
              );
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ],
    );
  }

  const filteredUsers = useMemo(() => {
    let list =
      activeFilter === "all"
        ? users
        : users.filter((user) => user.role === activeFilter);

    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((u) =>
      [u.name, u.email, u.phone, u.location, u.status, u.role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [activeFilter, query, users]);

  const counts = useMemo(
    () =>
      users.reduce<Record<string, number>>(
        (total, user) => {
          total.all += 1;
          total[user.role] = (total[user.role] || 0) + 1;
          return total;
        },
        { all: 0, farmer: 0, buyer: 0, manager: 0 },
      ),
    [users],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <Toast message={toast} onDone={() => setToast(null)} />

      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(true)}
            colors={["#2A5C43"]}
            tintColor="#2A5C43"
          />
        }
      >
        <Text className="text-3xl font-black text-[#2A5C43]">Users</Text>
        <Text className="text-gray-500 mt-1 mb-4">
          Registered accounts stored in the live database.
        </Text>

        {/* Register Farmer Quick Action Button */}
        <Pressable
          onPress={() => setShowCreate(true)}
          className="bg-[#2A5C43] rounded-2xl px-4 py-3.5 mb-4 flex-row items-center justify-center gap-2 shadow-sm"
        >
          <MaterialIcons name="person-add" size={20} color="#ffffff" />
          <Text className="text-white font-black text-base">
            Register New Farmer
          </Text>
        </Pressable>

        {/* Search Input */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-3 py-2.5 mb-4">
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search users by name, email, phone..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-gray-800 ml-2 font-medium"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <MaterialIcons name="close" size={18} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>

        {/* Role Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 ${active ? "bg-[#2A5C43]" : "bg-white border border-gray-200"}`}
                >
                  <Text
                    className={
                      active
                        ? "text-white font-black"
                        : "text-gray-700 font-black"
                    }
                  >
                    {labelFor(filter)} ({counts[filter] || 0})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* User Card List */}
        {filteredUsers.length ? (
          filteredUsers.map((user) => (
            <View
              key={user.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 mb-3"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-black text-[#2A5C43]">
                    {user.name}
                  </Text>
                  <Text className="text-gray-700 mt-0.5 font-medium">
                    {user.email}
                  </Text>
                </View>
                <View className="bg-[#E7F5EE] rounded-full px-3 py-1">
                  <Text className="text-[#2A5C43] text-[11px] font-black uppercase">
                    {user.role}
                  </Text>
                </View>
              </View>

              <View className="mt-3 gap-1">
                {user.unique_id ? (
                  <Detail icon="fingerprint" value={`ID: ${user.unique_id}`} />
                ) : null}
                <Detail icon="phone" value={user.phone || "No phone set"} />
                <Detail
                  icon="location-on"
                  value={user.location || "No location set"}
                />
                <Detail
                  icon="account-balance-wallet"
                  value={user.payment_details || "No payment details"}
                />
                <Detail icon="verified-user" value={user.status || "Active"} />
                <Detail
                  icon="event"
                  value={`Joined ${new Date(user.created_at).toLocaleDateString()}`}
                />
              </View>

              {/* Status Action Buttons for Farmers */}
              {user.role === "farmer" && (
                <View className="flex-row gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Pressable
                    disabled={
                      updatingId === user.id || user.status === "Active"
                    }
                    onPress={() => setStatus(user, "Active")}
                    className={`flex-1 py-2 rounded-xl items-center justify-center ${user.status === "Active" ? "bg-gray-100 border border-gray-200" : "bg-[#E7F5EE]"}`}
                  >
                    <Text
                      className={`font-black text-xs ${user.status === "Active" ? "text-gray-400" : "text-[#2A5C43]"}`}
                    >
                      Verify
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={
                      updatingId === user.id || user.status === "Suspended"
                    }
                    onPress={() => setStatus(user, "Suspended")}
                    className={`flex-1 py-2 rounded-xl items-center justify-center ${user.status === "Suspended" ? "bg-gray-100 border border-gray-200" : "bg-red-50"}`}
                  >
                    <Text
                      className={`font-black text-xs ${user.status === "Suspended" ? "text-gray-400" : "text-red-700"}`}
                    >
                      Suspend
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        ) : (
          <View className="bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="font-black text-[#2A5C43]">No users found</Text>
            <Text className="text-gray-500 mt-1">
              New registered users will appear here automatically.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Register Farmer Modal Form */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-black text-[#2A5C43]">
                Register New Farmer
              </Text>
              <Pressable
                onPress={() => {
                  setShowCreate(false);
                  resetCreateForm();
                }}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView className="space-y-3">
              <View>
                <Text className="text-xs font-bold text-gray-500 mb-1">
                  Full Name *
                </Text>
                <TextInput
                  value={newFarmer.name}
                  onChangeText={(v) => updateNewFarmer("name", v)}
                  placeholder="e.g. John Kamau"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-gray-500 mb-1">
                  Email Address (Optional)
                </Text>
                <TextInput
                  value={newFarmer.email}
                  onChangeText={(v) => updateNewFarmer("email", v)}
                  placeholder="auto-generated if empty"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-gray-500 mb-1">
                  Phone Number (M-Pesa)
                </Text>
                <TextInput
                  value={newFarmer.phone}
                  onChangeText={(v) => updateNewFarmer("phone", v)}
                  placeholder="e.g. 0712345678"
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-gray-500 mb-1">
                  Location / Farm Area
                </Text>
                <TextInput
                  value={newFarmer.location}
                  onChangeText={(v) => updateNewFarmer("location", v)}
                  placeholder="e.g. Murang'a South"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-gray-500 mb-1">
                  Payment Details (M-Pesa / Bank)
                </Text>
                <TextInput
                  value={newFarmer.payment_details}
                  onChangeText={(v) => updateNewFarmer("payment_details", v)}
                  placeholder="e.g. M-Pesa 0712345678"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-gray-500 mb-1">
                  Temporary Password *
                </Text>
                <TextInput
                  value={newFarmer.password}
                  onChangeText={(v) => updateNewFarmer("password", v)}
                  placeholder="e.g. Farmer123!"
                  secureTextEntry
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                />
              </View>

              <Pressable
                disabled={creating}
                onPress={createFarmer}
                className="bg-[#2A5C43] rounded-xl py-4 mt-5 items-center justify-center flex-row gap-2"
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons
                      name="person-add"
                      size={20}
                      color="#ffffff"
                    />
                    <Text className="text-white font-black text-base">
                      Complete Registration
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Detail({
  icon,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
}) {
  return (
    <View className="flex-row items-center">
      <MaterialIcons name={icon} size={16} color="#6b7280" />
      <Text className="text-gray-700 ml-2 font-medium">{value}</Text>
    </View>
  );
}

function labelFor(value: Role | "all") {
  return value[0].toUpperCase() + value.slice(1);
}
