import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useMemo, useState, useEffect } from "react"
import { Pressable, ScrollView, Text, View, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"
import { usePollingRefresh } from "../../lib/polling"
import { notifyNewListing } from "../../lib/notifications"
import { getSessionUser } from "../../lib/session"
import NotificationBell from "../../components/NotificationBell"
import { Toast, shortHash } from "../../components/Toast"

type Farmer = {
  id: string
  name: string
  location: string | null
  status: string
  total_yield_kg: string
}

type YieldItem = {
  id: string
  farmer: string
  crop_season: string
  variety: string
  quantity: string
  grade: string
  status: string
  created_at: string
}

type OrderItem = {
  id: string
  buyer: string
  produce: string
  quantity: string
  total_amount: string
  status: string
  payment_status?: string | null
  created_at: string
}

type PaymentItem = {
  id: string
  amount: string
  status: string
}

type ToastMsg = { text: string; type: "success" | "error" | "info" } | null

const managerHarvestCountKey = "managerHarvestCount"

export default function ManagerDashboard() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [yields, setYields] = useState<YieldItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [toast, setToast] = useState<ToastMsg>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [managerName, setManagerName] = useState("")

  const [trackingOrder, setTrackingOrder] = useState<OrderItem | null>(null)
  const [trackingStatus, setTrackingStatus] = useState("")
  const [trackingLocation, setTrackingLocation] = useState("")
  const [estimatedDelivery, setEstimatedDelivery] = useState("")

  useEffect(() => {
    getSessionUser().then((user) => setManagerName(user?.name || "Manager"))
  }, [])

  function showToast(text: string, type: "success" | "error" | "info" = "success") {
    setToast({ text, type })
  }

  const refresh = useCallback(async () => {
    const [farmersRes, yieldsRes, ordersRes, paymentsRes] = await Promise.all([
      api.get("/farmers"),
      api.get("/yields"),
      api.get("/orders"),
      api.get("/payments")
    ])
    const previousRaw = await AsyncStorage.getItem(managerHarvestCountKey)
    const previousCount = previousRaw ? Number(previousRaw) : yieldsRes.data.length

    if (yieldsRes.data.length > previousCount) {
      await notifyNewListing("New farmer harvest", `${yieldsRes.data.length - previousCount} new harvest record(s) need review.`)
    }

    await AsyncStorage.setItem(managerHarvestCountKey, String(yieldsRes.data.length))
    setFarmers(farmersRes.data)
    setYields(yieldsRes.data)
    setOrders(ordersRes.data)
    setPayments(paymentsRes.data)
  }, [])

  usePollingRefresh(refresh)

  const totals = useMemo(() => {
    const approvedSupply = yields
      .filter((item) => ["Approved", "Scheduled", "Exported"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const openDemand = orders
      .filter((item) => !["Paid", "Fulfilled", "Cancelled"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const paidAmount = payments
      .filter((item) => item.status === "Verified")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const pendingYields = yields.filter((item) => item.status === "Logged").length
    const pendingOrders = orders.filter((item) => item.status === "Processing").length

    return {
      approvedSupply,
      openDemand,
      paidAmount,
      pendingYields,
      pendingOrders,
      balance: approvedSupply - openDemand
    }
  }, [orders, payments, yields])

  async function updateYield(id: string, status: string) {
    setUpdatingId(id)
    try {
      await api.patch(`/yields/${id}/status`, { status })
      setYields((prev) => prev.map((y) => (y.id === id ? { ...y, status } : y)))
      const label = status === "Approved" ? "Approve success" : status === "Rejected" ? "Harvest rejected" : `Harvest ${status.toLowerCase()}`
      showToast(label, status === "Rejected" ? "error" : "success")
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || "Unable to update harvest", "error")
    } finally {
      setUpdatingId(null)
    }
  }

  async function updateOrder(id: string, status: string) {
    setUpdatingId(id)
    try {
      await api.patch(`/orders/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      const label = status === "Scheduled" ? "Order scheduled" : status === "Cancelled" ? "Order cancelled" : `Order ${status.toLowerCase()}`
      showToast(label, status === "Cancelled" ? "error" : "success")
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || "Unable to update order", "error")
    } finally {
      setUpdatingId(null)
    }
  }

  const queueYields = yields.filter((item) => item.status === "Logged").slice(0, 3)
  const queueOrders = orders.filter((item) => item.status === "Processing" || item.status === "Approved").slice(0, 3)
  const activeShipments = orders.filter((item) => ["Paid", "In Transit", "Ready for Pickup"].includes(item.status))

  async function handleUpdateTracking() {
    if (!trackingOrder) return
    setUpdatingId(trackingOrder.id)
    try {
      await api.patch(`/orders/${trackingOrder.id}/status`, {
        status: trackingStatus || trackingOrder.status,
        trackingLocation,
        estimatedDelivery
      })
      setOrders((prev) => prev.map((o) => (o.id === trackingOrder.id ? { ...o, status: trackingStatus || o.status, tracking_location: trackingLocation, estimated_delivery: estimatedDelivery } : o)))
      showToast("Tracking updated successfully")
      setTrackingOrder(null)
    } catch (error: any) {
      showToast(error?.response?.data?.error || error.message || "Unable to update tracking", "error")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <Toast message={toast} onDone={() => setToast(null)} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-[#E7F5EE] px-5 pt-6 pb-6">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[#2A5C43] text-sm font-bold opacity-70">
              Welcome, {managerName}
            </Text>
            <NotificationBell color="#2A5C43" />
          </View>
          <Text className="text-[#2A5C43] text-3xl font-black mb-1">Dashboard</Text>
          <Text className="text-[#2A5C43] opacity-80">Overview of platform activity</Text>
        </View>

        <View className="p-5">
          <View className="flex-row flex-wrap gap-3 mb-4">
            <Metric label="Farmers" value={farmers.length.toLocaleString()} icon="groups" />
            <Metric label="Approved Supply" value={`${totals.approvedSupply.toLocaleString()} kg`} icon="eco" />
            <Metric label="Open Demand" value={`${totals.openDemand.toLocaleString()} kg`} icon="shopping-cart" />
            <Metric label="Disbursed" value={`KES ${totals.paidAmount.toLocaleString()}`} icon="payments" />
          </View>

          <View className={`rounded-2xl p-4 mb-4 ${totals.balance >= 0 ? "bg-[#125C3F]" : "bg-[#7C2D12]"}`}>
            <Text className="text-white text-lg font-black">Supply Match</Text>
            <Text className="text-white mt-2">
              {totals.balance >= 0
                ? `${totals.balance.toLocaleString()} kg available after current buyer demand.`
                : `${Math.abs(totals.balance).toLocaleString()} kg shortage against open buyer orders.`}
            </Text>
          </View>

          <Text className="text-xl font-black text-[#2A5C43] mb-2">Approval Queue</Text>
          {queueYields.map((item) => {
            const isUpdating = updatingId === item.id
            return (
              <QueueCard
                key={`yield-${item.id}`}
                title={`Harvest #${shortHash(item.id)}`}
                subtitle={`${item.farmer || "Farmer"} · ${item.variety} · Grade ${item.grade}`}
                amount={`${Number(item.quantity || 0).toLocaleString()} kg`}
                approveLabel="Approve"
                rejectLabel="Reject"
                status={item.status}
                isUpdating={isUpdating}
                canApprove={true}
                canReject={true}
                onApprove={() => updateYield(item.id, "Approved")}
                onReject={() => updateYield(item.id, "Rejected")}
              />
            )
          })}
          {queueOrders.map((item) => {
            const isUpdating = updatingId === item.id
            return (
              <QueueCard
                key={`order-${item.id}`}
                title={`Order #${shortHash(item.id)}`}
                subtitle={`${item.buyer || "Buyer"} · ${item.produce}`}
                amount={`${Number(item.quantity || 0).toLocaleString()} kg`}
                approveLabel="Schedule"
                rejectLabel="Cancel"
                status={item.status}
                isUpdating={isUpdating}
                canApprove={item.status === "Approved"}
                canReject={item.status !== "Cancelled" && item.status !== "Paid" && item.status !== "Fulfilled"}
                onApprove={() => updateOrder(item.id, "Scheduled")}
                onReject={() => updateOrder(item.id, "Cancelled")}
              />
            )
          })}
          {!queueYields.length && !queueOrders.length ? (
            <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
              <Text className="font-black text-[#2A5C43]">All clear</Text>
              <Text className="text-gray-500 mt-1">New harvest submissions and buyer orders will appear here.</Text>
            </View>
          ) : <View className="h-4" />}

          {activeShipments.length > 0 && (
            <>
              <Text className="text-xl font-black text-[#2A5C43] mb-2">Active Shipments</Text>
              {activeShipments.map((item) => {
                const isUpdating = updatingId === item.id
                return (
                  <View key={`shipment-${item.id}`} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
                    <View className="flex-row justify-between mb-2">
                      <Text className="font-black text-gray-800 text-lg">Order #{shortHash(item.id)}</Text>
                      <View className="bg-[#E7F5EE] px-2 py-1 rounded-md">
                        <Text className="text-[#2A5C43] text-xs font-bold">{item.status}</Text>
                      </View>
                    </View>
                    <Text className="text-gray-500 mb-1">{item.buyer || "Buyer"} · {item.produce}</Text>
                    <Text className="text-gray-500 mb-3 text-sm">Qty: {Number(item.quantity || 0).toLocaleString()} kg</Text>
                    
                    <Pressable
                      className={`py-3 rounded-xl items-center ${isUpdating ? "bg-[#6d9a86]" : "bg-[#2A5C43]"}`}
                      disabled={isUpdating}
                      onPress={() => {
                        setTrackingOrder(item)
                        setTrackingStatus(item.status)
                        setTrackingLocation(item.tracking_location || "")
                        setEstimatedDelivery(item.estimated_delivery ? new Date(item.estimated_delivery).toISOString().split('T')[0] : "")
                      }}
                    >
                      <Text className="text-white font-black">{isUpdating ? "Processing..." : "Update Tracking"}</Text>
                    </Pressable>
                  </View>
                )
              })}
            </>
          )}
        </View>
      </ScrollView>

      {/* Tracking Update Modal */}
      {trackingOrder && (
        <View className="absolute inset-0 bg-black/50 justify-end z-50">
          <View className="bg-white rounded-t-3xl p-6 pb-12">
            <Text className="text-2xl font-black text-[#2A5C43] mb-1">Update Tracking</Text>
            <Text className="text-gray-500 mb-6">Order #{shortHash(trackingOrder.id)}</Text>

            <Text className="font-bold text-gray-700 mb-2">Status</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {["Paid", "In Transit", "Ready for Pickup", "Fulfilled"].map((opt) => (
                <Pressable
                  key={opt}
                  className={`px-4 py-2 border rounded-xl ${trackingStatus === opt ? "bg-[#2A5C43] border-[#2A5C43]" : "bg-white border-gray-300"}`}
                  onPress={() => setTrackingStatus(opt)}
                >
                  <Text className={`font-bold ${trackingStatus === opt ? "text-white" : "text-gray-600"}`}>{opt}</Text>
                </Pressable>
              ))}
            </View>

            <Text className="font-bold text-gray-700 mb-2">Current Location</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <TextInput
                value={trackingLocation}
                onChangeText={setTrackingLocation}
                placeholder="e.g. Nairobi Warehouse"
                style={{ outlineStyle: 'none' } as never}
                className="text-gray-800"
              />
            </View>

            <Text className="font-bold text-gray-700 mb-2">Est. Delivery Date</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
              <TextInput
                value={estimatedDelivery}
                onChangeText={setEstimatedDelivery}
                placeholder="YYYY-MM-DD"
                style={{ outlineStyle: 'none' } as never}
                className="text-gray-800"
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 py-4 bg-gray-200 rounded-xl items-center"
                onPress={() => setTrackingOrder(null)}
              >
                <Text className="text-gray-600 font-black">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-4 bg-[#2A5C43] rounded-xl items-center"
                onPress={handleUpdateTracking}
              >
                <Text className="text-white font-black">Save Updates</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 min-h-[116px] flex-1 min-w-[155px]">
      <MaterialIcons name={icon} size={22} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">{label}</Text>
      <Text className="text-[#2A5C43] text-xl font-black mt-1">{value}</Text>
    </View>
  )
}

function QueueCard({
  title,
  subtitle,
  amount,
  approveLabel,
  rejectLabel,
  status,
  isUpdating,
  canApprove,
  canReject,
  onApprove,
  onReject
}: {
  title: string
  subtitle: string
  amount: string
  approveLabel: string
  rejectLabel: string
  status: string
  isUpdating: boolean
  canApprove: boolean
  canReject: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const isApproved = status === "Approved" || status === "Scheduled"
  const isRejected = status === "Rejected" || status === "Cancelled"

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-black text-[#2A5C43]">{title}</Text>
          <Text className="text-gray-700 mt-1">{subtitle}</Text>
        </View>
        <Text className="font-black text-gray-900">{amount}</Text>
      </View>
      {isUpdating ? (
        <View className="flex-row mt-4 justify-center items-center py-2 gap-2">
          <ActivityIndicator size="small" color="#2A5C43" />
          <Text className="text-gray-500 font-bold text-sm">Updating…</Text>
        </View>
      ) : (
        <View className="flex-row gap-3 mt-4">
          {/* Approve / Schedule Button */}
          {isApproved ? (
            <View className="flex-1 bg-[#2A5C43] rounded-xl py-3 items-center flex-row justify-center gap-1">
              <MaterialIcons name="check-circle" size={14} color="#fff" />
              <Text className="text-white font-black">{status === "Scheduled" ? "Scheduled" : "Approved"}</Text>
            </View>
          ) : (
            <Pressable
              onPress={onApprove}
              disabled={!canApprove}
              style={({ pressed }) => ({
                opacity: !canApprove ? 0.45 : pressed ? 0.8 : 1
              })}
              className={`flex-1 rounded-xl py-3 items-center ${
                !canApprove ? "bg-gray-100" : "bg-[#2A5C43]"
              }`}
            >
              <Text className={`font-black ${!canApprove ? "text-gray-400" : "text-white"}`}>{approveLabel}</Text>
            </Pressable>
          )}

          {/* Reject / Cancel Button */}
          {isRejected ? (
            <View className="flex-1 bg-red-600 rounded-xl py-3 items-center flex-row justify-center gap-1">
              <MaterialIcons name="cancel" size={14} color="#fff" />
              <Text className="text-white font-black">{status === "Cancelled" ? "Cancelled" : "Rejected"}</Text>
            </View>
          ) : (
            <Pressable
              onPress={onReject}
              disabled={!canReject || isApproved}
              style={({ pressed }) => ({
                opacity: (!canReject || isApproved) ? 0.45 : pressed ? 0.8 : 1
              })}
              className={`flex-1 rounded-xl py-3 items-center border ${
                (!canReject || isApproved)
                  ? "bg-gray-100 border-transparent"
                  : "bg-white border-red-300"
              }`}
            >
              <Text className={`font-black ${(!canReject || isApproved) ? "text-gray-400" : "text-red-600"}`}>
                {rejectLabel}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}
