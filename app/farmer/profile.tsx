import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
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
import {
  canUseBiometrics,
  clearSession,
  disableBiometricSignIn,
  enableBiometricSignIn,
  getSessionUser,
  isBiometricSignInEnabled,
  type SessionUser,
} from "../../lib/session";
import LanguageSelector from "../../components/LanguageSelector";

type Profile = {
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  location?: string | null;
  status?: string;
  created_at?: string;
  unique_id?: string | null;
  payment_details?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
  manager_phone?: string | null;
  manager_unique_id?: string | null;
  manager_verified?: boolean | null;
};

type YieldItem = { id: number; quantity: string; grade: string };
type PaymentItem = { id: number; amount: string; status: string };
type Manager = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  unique_id?: string | null;
  verified: boolean;
};

export default function FarmerProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [yields, setYields] = useState<YieldItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [manager, setManager] = useState<Manager | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [linkingManagerId, setLinkingManagerId] = useState<string | null>(null);

  useEffect(() => {
    getSessionUser().then((user) => {
      if (user) {
        setProfile((prev) => prev || (user as unknown as Profile));
      }
    });
  }, []);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editMpesa, setEditMpesa] = useState("");
  const [editBank, setEditBank] = useState("");
  const [saving, setSaving] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete state
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  async function handleChangePassword() {
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters long.");
      return;
    }
    setChangingPassword(true);
    try {
      await api.patch("/auth/me/password", {
        newPassword: newPassword.trim(),
      });
      setShowPasswordModal(false);
      setNewPassword("");
      Alert.alert(
        "Password Updated ✓",
        "Your password has been changed successfully. Use your new password the next time you log in.",
      );
    } catch (err: any) {
      Alert.alert(
        "Update Failed",
        err?.response?.data?.error || err.message || "Unable to change password",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
      clearApiCache();
    }
    const [profileRes, yieldRes, payoutRes, managerRes] =
      await Promise.allSettled([
        fetchWithCache("/auth/me"),
        fetchWithCache("/yields"),
        fetchWithCache("/payouts"),
        fetchWithCache("/auth/managers/verified"),
      ]);

    if (profileRes.status === "fulfilled") {
      const profileData = profileRes.value.data as Profile;
      setProfile(profileData);
      await AsyncStorage.setItem("user", JSON.stringify(profileData));
      if (profileData.manager_id) {
        setManager({
          id: profileData.manager_id,
          name: profileData.manager_name || "Assigned Manager",
          email: profileData.manager_email || "",
          phone: profileData.manager_phone,
          unique_id: profileData.manager_unique_id,
          verified: Boolean(profileData.manager_verified),
        });
      } else {
        setManager(null);
      }
    }

    if (yieldRes.status === "fulfilled") {
      setYields(yieldRes.value.data);
    }

    if (payoutRes.status === "fulfilled") {
      setPayments(payoutRes.value.data);
    }

    if (managerRes.status === "fulfilled") {
      const verifiedManagers = managerRes.value.data as Manager[];
      setManagers(verifiedManagers);
    }

    setBiometricEnabled(await isBiometricSignInEnabled());
    setRefreshing(false);
  }, []);

  useFocusRefresh(refresh);

  const onRefresh = useCallback(() => {
    refresh(true);
  }, [refresh]);

  const parsedPayments = useMemo(
    () => parsePaymentDetails(profile?.payment_details),
    [profile?.payment_details],
  );

  const stats = useMemo(() => {
    const totalYield = yields.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );
    const verifiedPayments = payments
      .filter((item) => item.status === "Paid")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const gradeA = yields
      .filter((item) => item.grade === "A")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return {
      totalYield,
      verifiedPayments,
      gradeShare: totalYield ? Math.round((gradeA / totalYield) * 100) : 0,
    };
  }, [payments, yields]);

  function startEditing() {
    if (!profile) return;
    setEditName(profile.name || "");
    setEditPhone(profile.phone || "");
    setEditLocation(profile.location || "");
    const parsed = parsePaymentDetails(profile.payment_details);
    setEditMpesa(parsed.mpesa);
    setEditBank(parsed.bank);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function saveProfile() {
    if (!editName.trim()) {
      Alert.alert("Validation", "Name cannot be empty.");
      return;
    }
    setSaving(true);
    const m = editMpesa.trim();
    const b = editBank.trim();
    let combinedDetails = "";
    if (m && b) combinedDetails = `M-Pesa: ${m} | Bank: ${b}`;
    else if (m) combinedDetails = `M-Pesa: ${m}`;
    else if (b) combinedDetails = `Bank: ${b}`;

    try {
      const { data } = await api.patch("/auth/me", {
        name: editName.trim(),
        phone: editPhone.trim(),
        location: editLocation.trim(),
        payment_details: combinedDetails,
      });
      setProfile(data);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      setEditing(false);
    } catch (err: any) {
      Alert.alert("Save failed", err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await clearSession();
    router.replace("/");
  }

  async function handleDelete() {
    const requiredId = profile?.unique_id || profile?.email;
    if (!deleteConfirmId || deleteConfirmId.trim() !== requiredId) {
      Alert.alert(
        "Validation Failed",
        "The confirmation ID you entered does not match.",
      );
      return;
    }
    try {
      await api.delete("/auth/me");
      await clearSession();
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Delete failed", err?.response?.data?.error || err.message);
    }
  }

  async function toggleBiometrics() {
    try {
      if (biometricEnabled) {
        await disableBiometricSignIn();
        setBiometricEnabled(false);
        return;
      }
      if (!profile) return;
      const available = await canUseBiometrics();
      if (!available) {
        Alert.alert(
          "Biometrics unavailable",
          "Add a fingerprint or face unlock on this phone first.",
        );
        return;
      }
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          "Sign in again",
          "Please sign in with your password before enabling biometrics.",
        );
        return;
      }
      await enableBiometricSignIn(token, profile as SessionUser);
      setBiometricEnabled(true);
    } catch (error: any) {
      Alert.alert("Biometric setup failed", error.message);
    }
  }

  async function linkManager(selectedManager: Manager) {
    setLinkingManagerId(selectedManager.id);
    try {
      const { data } = await api.patch("/auth/me/manager", {
        manager_id: selectedManager.id,
      });
      clearApiCache();
      setProfile(data);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      setManager(selectedManager);
      Alert.alert(
        "Manager linked",
        `${selectedManager.name} is now assigned to your account.`,
      );
    } catch (err: any) {
      Alert.alert(
        "Could not link manager",
        err?.response?.data?.error || "Please try again shortly.",
      );
    } finally {
      setLinkingManagerId(null);
    }
  }

  function contactManager(type: "phone" | "email", selectedManager: Manager) {
    const target =
      type === "phone" ? selectedManager.phone : selectedManager.email;
    if (!target) {
      Alert.alert(
        "Contact unavailable",
        "This manager has not added those contact details yet.",
      );
      return;
    }
    Linking.openURL(type === "phone" ? `tel:${target}` : `mailto:${target}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2A5C43"]}
            tintColor="#2A5C43"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-3xl font-black text-[#2A5C43]">Profile</Text>
          <LanguageSelector color="#6b7280" />
          <View className="flex-row gap-2">
            {!editing && (
              <Pressable
                onPress={startEditing}
                className="h-11 w-11 rounded-full bg-white border border-gray-200 items-center justify-center"
              >
                <MaterialIcons name="edit" size={20} color="#2A5C43" />
              </Pressable>
            )}
          </View>
        </View>
        <Text className="text-gray-500 mt-1 mb-5">
          Your live account and farm performance summary.
        </Text>

        {/* Hero card */}
        <View className="bg-[#125C3F] rounded-2xl p-5 mb-4">
          <View className="h-14 w-14 rounded-full bg-white/15 items-center justify-center mb-4">
            <MaterialIcons name="person" size={30} color="#ffffff" />
          </View>
          <Text className="text-white text-2xl font-black">
            {profile?.name || "Farmer"}
          </Text>
          <Text className="text-[#D7F3E5] mt-1">
            {profile?.email || "Loading account..."}
          </Text>
          {profile?.unique_id ? (
            <Text className="text-[#D7F3E5] mt-1 font-bold">
              ID: {profile.unique_id}
            </Text>
          ) : null}
          <View className="self-start bg-white/15 rounded-full px-3 py-1 mt-3">
            <Text className="text-white text-[11px] uppercase font-black">
              {profile?.status || "Active"}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <Metric
            label="Yield"
            value={`${stats.totalYield.toLocaleString()} kg`}
          />
          <Metric
            label="Paid"
            value={`KES ${stats.verifiedPayments.toLocaleString()}`}
          />
        </View>
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <Text className="text-[11px] text-gray-500 uppercase font-black">
            Grade A Share
          </Text>
          <View className="h-3 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <View
              className="h-3 bg-[#2A5C43] rounded-full"
              style={{ width: `${stats.gradeShare}%` }}
            />
          </View>
          <Text className="text-gray-800 font-black mt-2">
            {stats.gradeShare}% of logged yield
          </Text>
        </View>

        {/* Details / Edit form */}
        {profile ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[11px] text-gray-500 uppercase font-black">
                Account Details
              </Text>
              {editing && (
                <Text className="text-xs text-[#2A5C43] font-bold">
                  Editing
                </Text>
              )}
            </View>

            <Row label="Unique ID" value={profile.unique_id || "Not set"} />
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role} />
            <Row
              label="Member Since"
              value={
                profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "Not available"
              }
            />

            {editing ? (
              <>
                <EditField
                  label="Name"
                  value={editName}
                  onChangeText={setEditName}
                  icon="person-outline"
                />
                <EditField
                  label="Phone"
                  value={editPhone}
                  onChangeText={setEditPhone}
                  icon="phone"
                  keyboardType="phone-pad"
                />
                <EditField
                  label="Location"
                  value={editLocation}
                  onChangeText={setEditLocation}
                  icon="location-on"
                />
                <EditField
                  label="M-Pesa Number"
                  value={editMpesa}
                  onChangeText={setEditMpesa}
                  icon="smartphone"
                  keyboardType="phone-pad"
                  placeholder="e.g. 0727019252"
                />
                <EditField
                  label="Bank Account Details"
                  value={editBank}
                  onChangeText={setEditBank}
                  icon="account-balance"
                  placeholder="e.g. KCB Bank - 1234567890"
                />

                <View className="flex-row gap-3 mt-4">
                  <Pressable
                    onPress={cancelEditing}
                    className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-600 font-bold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={saveProfile}
                    disabled={saving}
                    className={`flex-1 rounded-xl py-3 items-center flex-row justify-center gap-2 ${saving ? "bg-[#53866f]" : "bg-[#2A5C43]"}`}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : null}
                    <Text className="text-white font-bold">
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Row label="Name" value={profile.name} />
                <Row label="Phone" value={profile.phone || "Not set"} />
                <Row label="Location" value={profile.location || "Not set"} />
                <Row
                  label="M-Pesa Details"
                  value={parsedPayments.mpesa || "Not set"}
                />
                <Row
                  label="Bank Details"
                  value={parsedPayments.bank || "Not set"}
                />
              </>
            )}
          </View>
        ) : null}

        {/* Verified Manager Card */}
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="verified-user" size={18} color="#2A5C43" />
            <Text className="text-[11px] text-gray-500 uppercase font-black">
              Your Cooperative Manager
            </Text>
          </View>
          {manager ? (
            <>
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-full bg-[#E7F5EE] items-center justify-center">
                  <MaterialIcons
                    name="manage-accounts"
                    size={24}
                    color="#2A5C43"
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-gray-900 font-black text-base">
                      {manager.name}
                    </Text>
                    <MaterialIcons name="verified" size={16} color="#2A5C43" />
                  </View>
                  <Text className="text-gray-500 text-sm">{manager.email}</Text>
                </View>
              </View>
              {manager.phone ? (
                <View className="flex-row items-center gap-2 mt-3 bg-[#F4FBF7] rounded-xl px-3 py-2">
                  <MaterialIcons name="phone" size={15} color="#2A5C43" />
                  <Text className="text-[#2A5C43] font-bold text-sm">
                    {manager.phone}
                  </Text>
                </View>
              ) : null}
              {manager.unique_id ? (
                <Text className="text-xs text-gray-400 mt-2">
                  Manager ID: {manager.unique_id}
                </Text>
              ) : null}
              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => contactManager("phone", manager)}
                  className="flex-1 bg-[#E7F5EE] rounded-xl py-3 items-center flex-row justify-center gap-2"
                >
                  <MaterialIcons name="phone" size={16} color="#2A5C43" />
                  <Text className="text-[#2A5C43] font-black text-xs">
                    Call
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => contactManager("email", manager)}
                  className="flex-1 bg-[#E7F5EE] rounded-xl py-3 items-center flex-row justify-center gap-2"
                >
                  <MaterialIcons
                    name="mail-outline"
                    size={16}
                    color="#2A5C43"
                  />
                  <Text className="text-[#2A5C43] font-black text-xs">
                    Email
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View className="flex-row items-center gap-2 bg-amber-50 rounded-xl px-3 py-3">
              <MaterialIcons name="info-outline" size={18} color="#d97706" />
              <Text className="text-amber-700 text-sm font-medium flex-1">
                No verified manager assigned yet.
              </Text>
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="groups" size={18} color="#2A5C43" />
            <Text className="text-[11px] text-gray-500 uppercase font-black">
              Available Managers
            </Text>
          </View>
          {managers.length > 0 ? (
            managers.map((item) => {
              const isAssigned =
                item.id === profile?.manager_id || item.id === manager?.id;
              const isLinking = linkingManagerId === item.id;
              return (
                <View
                  key={item.id}
                  className="border border-gray-100 rounded-xl p-3 mb-3"
                >
                  <View className="flex-row items-start gap-3">
                    <View className="h-10 w-10 rounded-full bg-[#E7F5EE] items-center justify-center">
                      <MaterialIcons
                        name="support-agent"
                        size={21}
                        color="#2A5C43"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-gray-900 font-black">
                          {item.name}
                        </Text>
                        <MaterialIcons
                          name="verified"
                          size={14}
                          color="#2A5C43"
                        />
                      </View>
                      <Text className="text-gray-500 text-xs mt-0.5">
                        {item.email}
                      </Text>
                      {item.phone ? (
                        <Text className="text-gray-500 text-xs mt-0.5">
                          {item.phone}
                        </Text>
                      ) : null}
                      {item.unique_id ? (
                        <Text className="text-gray-400 text-[10px] mt-1">
                          ID: {item.unique_id}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View className="flex-row gap-2 mt-3">
                    <Pressable
                      onPress={() => contactManager("phone", item)}
                      className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 items-center justify-center"
                    >
                      <MaterialIcons name="phone" size={16} color="#2A5C43" />
                    </Pressable>
                    <Pressable
                      onPress={() => contactManager("email", item)}
                      className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 items-center justify-center"
                    >
                      <MaterialIcons
                        name="mail-outline"
                        size={16}
                        color="#2A5C43"
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => linkManager(item)}
                      disabled={isAssigned || Boolean(linkingManagerId)}
                      className={`flex-1 rounded-xl py-3 items-center flex-row justify-center gap-2 ${isAssigned ? "bg-gray-100" : "bg-[#2A5C43]"}`}
                    >
                      {isLinking ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : null}
                      <Text
                        className={`font-black text-xs ${isAssigned ? "text-gray-500" : "text-white"}`}
                      >
                        {isAssigned
                          ? "Assigned"
                          : isLinking
                            ? "Linking..."
                            : "Link Manager"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="flex-row items-center gap-2 bg-amber-50 rounded-xl px-3 py-3">
              <MaterialIcons name="info-outline" size={18} color="#d97706" />
              <Text className="text-amber-700 text-sm font-medium flex-1">
                No verified managers are available right now.
              </Text>
            </View>
          )}
        </View>

        {/* Security & Password */}
        <Pressable
          onPress={() => setShowPasswordModal(true)}
          className="rounded-xl bg-white border border-gray-200 py-4 flex-row items-center justify-center gap-2 mb-3"
        >
          <MaterialIcons name="lock-reset" size={20} color="#2A5C43" />
          <Text className="text-[#2A5C43] font-black">
            Reset / Change Password
          </Text>
        </Pressable>

        {/* Biometrics */}
        <Pressable
          onPress={toggleBiometrics}
          className="rounded-xl bg-white border border-gray-200 py-4 flex-row items-center justify-center gap-2 mb-3"
        >
          <MaterialIcons name="fingerprint" size={20} color="#2A5C43" />
          <Text className="text-[#2A5C43] font-black">
            {biometricEnabled
              ? "Disable biometric sign in"
              : "Enable biometric sign in"}
          </Text>
        </Pressable>

        <Pressable
          onPress={logout}
          className="rounded-xl bg-[#2A5C43] py-4 flex-row items-center justify-center gap-2 mb-2"
        >
          <MaterialIcons name="logout" size={19} color="#ffffff" />
          <Text className="text-white font-black">Logout</Text>
        </Pressable>

        {/* Danger Zone */}
        {deleteMode ? (
          <View className="bg-red-50 rounded-xl p-4 border border-red-200 mb-8 mt-2">
            <Text className="text-xs text-red-800 font-bold mb-2">
              Type {profile?.unique_id || profile?.email} to confirm deletion:
            </Text>
            <TextInput
              className="bg-white border border-red-300 rounded-lg p-2 text-red-900 mb-3"
              value={deleteConfirmId}
              onChangeText={setDeleteConfirmId}
              placeholder="Enter ID"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  setDeleteMode(false);
                  setDeleteConfirmId("");
                }}
                className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-700 font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className="flex-1 bg-red-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-bold text-xs">
                  Confirm Delete
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setDeleteMode(true)}
            className="mt-2 mb-8 self-center pb-4"
          >
            <Text className="text-[11px] text-red-400 font-bold uppercase">
              Danger: Delete Account
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="lock-reset" size={26} color="#2A5C43" />
                <Text className="text-xl font-black text-[#2A5C43]">Reset Password</Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <Text className="text-gray-600 mb-4 text-sm font-medium">
              Update your account password below. (Minimum 6 characters).
            </Text>

            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-500 mb-1">New Password</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-1">
                <MaterialIcons name="lock-outline" size={18} color="#2A5C43" />
                <TextInput
                  className="flex-1 min-h-[44px] ml-2 text-gray-900 font-medium"
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPasswordText}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Pressable onPress={() => setShowNewPasswordText((v) => !v)}>
                  <MaterialIcons
                    name={showNewPasswordText ? "visibility-off" : "visibility"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              disabled={changingPassword}
              onPress={handleChangePassword}
              className="bg-[#2A5C43] rounded-xl py-3.5 mt-2 items-center justify-center flex-row gap-2 shadow-md active:opacity-80"
            >
              {changingPassword ? <ActivityIndicator color="#ffffff" style={{ marginRight: 6 }} /> : null}
              <Text className="text-white font-bold text-base">
                {changingPassword ? "Updating..." : "Save New Password"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200">
      <Text className="text-[11px] text-gray-500 uppercase font-black">
        {label}
      </Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="py-3 border-b border-gray-100">
      <Text className="text-[11px] text-gray-500 uppercase font-black">
        {label}
      </Text>
      <Text className="text-gray-900 font-semibold mt-1">{value}</Text>
    </View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  icon,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: "default" | "phone-pad" | "email-address";
  placeholder?: string;
}) {
  return (
    <View className="mb-3 mt-1">
      <Text className="text-[11px] font-bold text-gray-500 uppercase mb-1">
        {label}
      </Text>
      <View className="flex-row items-center bg-gray-50 border border-[#2A5C43] rounded-xl px-3">
        <MaterialIcons name={icon} size={18} color="#2A5C43" />
        <TextInput
          className="flex-1 min-h-[44px] ml-2 text-gray-800"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          autoCapitalize={keyboardType === "phone-pad" ? "none" : "words"}
          style={{ outlineStyle: "none" } as never}
        />
      </View>
    </View>
  );
}

function parsePaymentDetails(details?: string | null) {
  if (!details) return { mpesa: "", bank: "" };
  let mpesa = "";
  let bank = "";
  if (details.includes("M-Pesa:") || details.includes("Bank:")) {
    const parts = details.split("|").map((s) => s.trim());
    for (const part of parts) {
      if (part.startsWith("M-Pesa:")) {
        mpesa = part.replace("M-Pesa:", "").trim();
      } else if (part.startsWith("Bank:")) {
        bank = part.replace("Bank:", "").trim();
      }
    }
  } else {
    const clean = details.trim();
    if (/^[\d\s+\-]+$/.test(clean)) {
      mpesa = clean;
    } else {
      bank = clean;
    }
  }
  return { mpesa, bank };
}
