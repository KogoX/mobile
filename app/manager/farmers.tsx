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
import { usePollingRefresh } from "../../lib/polling";
import { Toast } from "../../components/Toast";

type FarmerSummary = {
  id: string;
  name: string;
  location: string | null;
  status: string;
  manager_id?: string | null;
  manager_name?: string | null;
  total_yield_kg: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  location?: string | null;
  status: string;
  created_at: string;
  manager_id?: string | null;
  manager_name?: string | null;
};

type Farmer = FarmerSummary & {
  email?: string;
  phone?: string | null;
  created_at?: string;
};

const STATUS_CONFIG = {
  Active: {
    bg: "bg-[#E7F5EE]",
    text: "text-[#2A5C43]",
    dot: "#2A5C43",
    label: "Active",
  },
  Pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "#d97706",
    label: "Pending",
  },
  Suspended: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "#dc2626",
    label: "Suspended",
  },
};

type ToastMsg = { text: string; type: "success" | "error" | "info" } | null;

export default function ManagerFarmers() {
  const [farmers, setFarmers] = useState<FarmerSummary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMsg>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    payment_details: "",
    password: "",
  });

  const loadFromCache = useCallback(() => {
    AsyncStorage.multiGet([
      "manager_farmers_cache",
      "manager_users_cache",
    ]).then((stores) => {
      const fData = stores[0][1];
      const uData = stores[1][1];
      if (fData)
        try {
          setFarmers(JSON.parse(fData));
        } catch {}
      if (uData)
        try {
          setUsers(JSON.parse(uData));
        } catch {}
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
    const [farmersRes, usersRes] = await Promise.allSettled([
      fetchWithCache("/farmers"),
      fetchWithCache("/auth/users"),
    ]);

    if (farmersRes.status === "fulfilled") {
      setFarmers(farmersRes.value.data);
      AsyncStorage.setItem(
        "manager_farmers_cache",
        JSON.stringify(farmersRes.value.data),
      ).catch(() => {});
    }
    if (usersRes.status === "fulfilled") {
      setUsers(usersRes.value.data);
      AsyncStorage.setItem(
        "manager_users_cache",
        JSON.stringify(usersRes.value.data),
      ).catch(() => {});
    }
    setRefreshing(false);
  }, []);

  usePollingRefresh(refresh);

  const rows = useMemo(() => {
    const userMap = new Map(
      users.filter((u) => u.role === "farmer").map((u) => [u.id, u]),
    );
    return farmers.map((farmer) => {
      const user = userMap.get(farmer.id);
      return {
        ...farmer,
        email: user?.email,
        phone: user?.phone,
        created_at: user?.created_at,
        status: user?.status || farmer.status,
        manager_id: user?.manager_id || farmer.manager_id,
        manager_name: user?.manager_name || farmer.manager_name,
      };
    });
  }, [farmers, users]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((f) =>
      [f.name, f.email, f.phone, f.location, f.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [query, rows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((f) => f.status === "Active").length,
      pending: rows.filter((f) => f.status === "Pending").length,
      suspended: rows.filter((f) => f.status === "Suspended").length,
      totalYield: rows.reduce(
        (sum, f) => sum + Number(f.total_yield_kg || 0),
        0,
      ),
    }),
    [rows],
  );

  async function updateStatus(farmer: Farmer, status: string) {
    const actionLabel =
      status === "Active"
        ? "Verify"
        : status === "Pending"
          ? "send back for Review"
          : "Suspend";
    const message =
      status === "Active"
        ? `Verify ${farmer.name}? Their harvests will appear in the buyer market.`
        : status === "Suspended"
          ? `Suspend ${farmer.name}? Their listings will be hidden from buyers.`
          : `Send ${farmer.name} back to Pending review?`;

    Alert.alert(
      `${status === "Active" ? "Verify" : status === "Suspended" ? "Suspend" : "Review"} Farmer`,
      message,
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
            setUpdatingId(farmer.id);
            try {
              await api.patch(`/auth/users/${farmer.id}/status`, { status });
              // Optimistically update local state immediately
              setFarmers((prev) =>
                prev.map((f) => (f.id === farmer.id ? { ...f, status } : f)),
              );
              setUsers((prev) =>
                prev.map((u) => (u.id === farmer.id ? { ...u, status } : u)),
              );
              const label =
                status === "Active"
                  ? `${farmer.name} verified`
                  : status === "Suspended"
                    ? `${farmer.name} suspended`
                    : `${farmer.name} sent for review`;
              showToast(label, status === "Suspended" ? "error" : "success");
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
      setFarmers((current) => [data, ...current]);
      setUsers((current) => [data, ...current]);
      setShowCreate(false);
      resetCreateForm();
      showToast(`${data.name} registered and linked to you.`);
      Alert.alert(
        "Farmer registered",
        `Login email: ${data.email}\nTemporary password: ${newFarmer.password}`,
      );
      await refresh();
    } catch (err: any) {
      showToast(
        err?.response?.data?.error ||
          err.message ||
          "Farmer registration failed",
        "error",
      );
    } finally {
      setCreating(false);
    }
  }

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
        <Text className="text-3xl font-black text-[#2A5C43]">
          Farmer Registry
        </Text>
        <Text className="text-gray-500 mt-1 mb-5">
          Verify farmers to list their harvests in the buyer market.
        </Text>

        <Pressable
          onPress={() => setShowCreate(true)}
          className="bg-[#2A5C43] rounded-2xl px-4 py-4 mb-4 flex-row items-center justify-center gap-2"
        >
          <MaterialIcons name="person-add" size={20} color="#ffffff" />
          <Text className="text-white font-black">Register Farmer</Text>
        </Pressable>

        {/* Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row gap-3">
            <StatCard
              label="Total"
              value={stats.total}
              icon="groups"
              color="#2A5C43"
              bg="#E7F5EE"
            />
            <StatCard
              label="Active"
              value={stats.active}
              icon="verified"
              color="#2A5C43"
              bg="#dcfce7"
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon="pending"
              color="#d97706"
              bg="#fef3c7"
            />
            <StatCard
              label="Suspended"
              value={stats.suspended}
              icon="block"
              color="#dc2626"
              bg="#fee2e2"
            />
            <StatCard
              label="Yield Logged"
              value={`${stats.totalYield.toLocaleString()} kg`}
              icon="eco"
              color="#2A5C43"
              bg="#E7F5EE"
              wide
            />
          </View>
        </ScrollView>

        {/* Search */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 mb-4">
          <MaterialIcons name="search" size={20} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search farmers, contacts, regions..."
            placeholderTextColor="#9ca3af"
            className="flex-1 min-h-[48px] ml-2 text-gray-800"
            style={{ outlineStyle: "none" } as never}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <MaterialIcons name="close" size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        {filteredRows.length === 0 && (
          <View className="items-center py-16">
            <MaterialIcons name="people-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 font-bold mt-3">
              No farmers found
            </Text>
          </View>
        )}

        {filteredRows.map((farmer) => {
          const cfg =
            STATUS_CONFIG[farmer.status as keyof typeof STATUS_CONFIG] ??
            STATUS_CONFIG.Pending;
          const isUpdating = updatingId === farmer.id;
          const isExpanded = expandedId === farmer.id;

          return (
            <View
              key={farmer.id}
              className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden"
            >
              {/* Status accent bar */}
              <View
                className="h-1 w-full"
                style={{
                  backgroundColor:
                    farmer.status === "Active"
                      ? "#2A5C43"
                      : farmer.status === "Suspended"
                        ? "#dc2626"
                        : "#d97706",
                }}
              />

              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : farmer.id)}
                className="p-4"
              >
                <View className="flex-row items-start justify-between gap-3">
                  {/* Avatar */}
                  <View
                    className="h-12 w-12 rounded-full items-center justify-center mr-1"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <MaterialIcons name="person" size={24} color={cfg.dot} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text className="text-lg font-black text-gray-900">
                        {farmer.name}
                      </Text>
                      {farmer.status === "Active" && (
                        <MaterialIcons
                          name="verified"
                          size={16}
                          color="#2A5C43"
                        />
                      )}
                    </View>
                    <Text className="text-gray-500 text-sm mt-0.5">
                      {farmer.location || "No location set"}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {farmer.email || "No email"}
                    </Text>
                  </View>

                  {/* Status pill */}
                  <View className={`rounded-full px-3 py-1 ${cfg.bg}`}>
                    <View className="flex-row items-center gap-1">
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cfg.dot }}
                      />
                      <Text
                        className={`text-[11px] font-black uppercase ${cfg.text}`}
                      >
                        {cfg.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Yield + join row */}
                <View className="flex-row gap-4 mt-3 px-1">
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons name="eco" size={14} color="#2A5C43" />
                    <Text className="text-gray-700 font-bold text-sm">
                      {Number(farmer.total_yield_kg || 0).toLocaleString()} kg
                      logged
                    </Text>
                  </View>
                  {farmer.created_at ? (
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons
                        name="calendar-today"
                        size={13}
                        color="#9ca3af"
                      />
                      <Text className="text-gray-400 text-xs">
                        Joined{" "}
                        {new Date(farmer.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {farmer.manager_name ? (
                  <View className="flex-row items-center gap-1 mt-2 px-1">
                    <MaterialIcons
                      name="supervisor-account"
                      size={14}
                      color="#6b7280"
                    />
                    <Text className="text-gray-500 text-xs font-bold">
                      Manager: {farmer.manager_name}
                    </Text>
                  </View>
                ) : null}

                {/* Expand indicator */}
                <View className="flex-row justify-center mt-2">
                  <MaterialIcons
                    name={isExpanded ? "expand-less" : "expand-more"}
                    size={20}
                    color="#9ca3af"
                  />
                </View>
              </Pressable>

              {/* Expanded actions */}
              {isExpanded && (
                <View className="px-4 pb-4 border-t border-gray-100 pt-3">
                  {farmer.phone ? (
                    <View className="flex-row items-center gap-2 mb-3 bg-gray-50 rounded-xl px-3 py-2">
                      <MaterialIcons name="phone" size={15} color="#6b7280" />
                      <Text className="text-gray-700 font-medium text-sm">
                        {farmer.phone}
                      </Text>
                    </View>
                  ) : null}

                  {isUpdating ? (
                    <View className="items-center py-4">
                      <ActivityIndicator color="#2A5C43" />
                      <Text className="text-gray-500 text-sm mt-2 font-medium">
                        Updating...
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row gap-2">
                      {farmer.status !== "Active" && (
                        <ActionBtn
                          label="✓ Verify"
                          onPress={() => updateStatus(farmer, "Active")}
                          tone="verify"
                        />
                      )}
                      {farmer.status !== "Pending" && (
                        <ActionBtn
                          label="⟳ Review"
                          onPress={() => updateStatus(farmer, "Pending")}
                          tone="neutral"
                        />
                      )}
                      {farmer.status !== "Suspended" && (
                        <ActionBtn
                          label="✕ Suspend"
                          onPress={() => updateStatus(farmer, "Suspended")}
                          tone="danger"
                        />
                      )}
                    </View>
                  )}

                  {farmer.status === "Active" && (
                    <View className="flex-row items-center gap-2 mt-3 bg-[#E7F5EE] rounded-xl px-3 py-2">
                      <MaterialIcons
                        name="storefront"
                        size={15}
                        color="#2A5C43"
                      />
                      <Text className="text-[#2A5C43] text-xs font-bold">
                        Harvests visible in buyer market
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowCreate(false)}
        >
          <View
            className="bg-white rounded-t-3xl p-6"
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-[#2A5C43] text-2xl font-black">
              Register Farmer
            </Text>
            <Text className="text-gray-500 mt-1 mb-5">
              Create an account for a farmer and link it to your manager
              profile.
            </Text>

            <CreateField
              label="Full Name"
              value={newFarmer.name}
              onChangeText={(v) => updateNewFarmer("name", v)}
              icon="person-outline"
            />
            <CreateField
              label="Email (optional)"
              value={newFarmer.email}
              onChangeText={(v) => updateNewFarmer("email", v)}
              icon="mail-outline"
              keyboardType="email-address"
            />
            <CreateField
              label="Phone"
              value={newFarmer.phone}
              onChangeText={(v) => updateNewFarmer("phone", v)}
              icon="phone"
              keyboardType="phone-pad"
            />
            <CreateField
              label="Location"
              value={newFarmer.location}
              onChangeText={(v) => updateNewFarmer("location", v)}
              icon="location-on"
            />
            <CreateField
              label="Payment Details"
              value={newFarmer.payment_details}
              onChangeText={(v) => updateNewFarmer("payment_details", v)}
              icon="account-balance-wallet"
            />
            <CreateField
              label="Temporary Password"
              value={newFarmer.password}
              onChangeText={(v) => updateNewFarmer("password", v)}
              icon="lock-outline"
              secureTextEntry
            />

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowCreate(false)}
                disabled={creating}
                className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-600 font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={createFarmer}
                disabled={creating}
                className={`flex-1 rounded-xl py-3 items-center flex-row justify-center gap-2 ${creating ? "bg-[#6d9a86]" : "bg-[#2A5C43]"}`}
              >
                {creating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : null}
                <Text className="text-white font-bold">
                  {creating ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  wide,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bg: string;
  wide?: boolean;
}) {
  return (
    <View
      className="rounded-2xl p-4 items-start"
      style={{ backgroundColor: bg, minWidth: wide ? 160 : 100 }}
    >
      <MaterialIcons name={icon} size={20} color={color} />
      <Text className="text-[10px] font-black uppercase mt-2" style={{ color }}>
        {label}
      </Text>
      <Text className="text-xl font-black mt-1" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone: "verify" | "neutral" | "danger";
}) {
  const styles = {
    verify: "bg-[#2A5C43]",
    neutral: "bg-white border border-gray-300",
    danger: "bg-white border border-red-200",
  };
  const textStyles = {
    verify: "text-white",
    neutral: "text-gray-700",
    danger: "text-red-600",
  };
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-xl py-3 items-center active:opacity-70 ${styles[tone]}`}
    >
      <Text className={`font-black text-sm ${textStyles[tone]}`}>{label}</Text>
    </Pressable>
  );
}

function CreateField({
  label,
  value,
  onChangeText,
  icon,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="text-[11px] text-gray-500 uppercase font-black mb-1">
        {label}
      </Text>
      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3">
        <MaterialIcons name={icon} size={18} color="#6b7280" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          className="flex-1 min-h-[44px] ml-2 text-gray-800"
          style={{ outlineStyle: "none" } as never}
        />
      </View>
    </View>
  );
}
