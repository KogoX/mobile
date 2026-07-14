import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import api from "../../lib/api"

type Farmer = {
  id: string
  name: string
  location: string | null
  phone?: string | null
}

type Payout = {
  id: string
  farmer: string | null
  amount: string
  method: string
  status: string
  reference: string | null
  created_at: string
}

const METHODS = ["mpesa", "bank", "cash"] as const
type Method = (typeof METHODS)[number]

export default function ManagerDisburse() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
  const [showFarmerPicker, setShowFarmerPicker] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<Method>("mpesa")
  const [phone, setPhone] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [farmersRes, payoutsRes] = await Promise.all([api.get("/farmers"), api.get("/payouts")])
      setFarmers(farmersRes.data)
      setPayouts(payoutsRes.data)
    } catch (error) {
      console.warn("Failed to load payouts:", error)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 8000)
      return () => clearInterval(timer)
    }, [refresh])
  )

  function chooseFarmer(farmer: Farmer) {
    setSelectedFarmer(farmer)
    setPhone(farmer.phone ? farmer.phone.replace(/^\+\d+/, "") : "")
    setShowFarmerPicker(false)
  }

  async function submitPayout() {
    if (!selectedFarmer || !amount) {
      Alert.alert("Missing details", "Select a farmer and enter an amount.")
      return
    }
    if (method === "mpesa" && !phone) {
      Alert.alert("Missing phone", "Enter the farmer's M-Pesa phone number.")
      return
    }
    if (method === "bank" && (!bankCode || !accountNumber)) {
      Alert.alert("Missing bank details", "Enter the bank code and account number.")
      return
    }

    try {
      setSubmitting(true)
      await api.post("/payouts", {
        farmer_id: selectedFarmer.id,
        amount: Number(amount),
        method,
        phone: method === "mpesa" ? `+${phone.replace(/[^0-9]/g, "")}` : undefined,
        bank_code: method === "bank" ? bankCode : undefined,
        account_number: method === "bank" ? accountNumber : undefined,
        notes: notes || undefined
      })
      Alert.alert("Payout initiated", "The payout has been recorded.")
      setAmount("")
      setNotes("")
      setAccountNumber("")
      setBankCode("")
      refresh()
    } catch (error: any) {
      Alert.alert("Payout failed", error?.response?.data?.error || error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/payouts/${id}/status`, { status })
      refresh()
    } catch (error: any) {
      Alert.alert("Unable to update", error?.response?.data?.error || error.message)
    }
  }

  const totals = useMemo(() => {
    const paid = payouts.filter((item) => item.status === "Paid")
    return {
      paidAmount: paid.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      pendingAmount: payouts
        .filter((item) => item.status !== "Paid")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      paidCount: paid.length
    }
  }, [payouts])

  return (
    <SafeAreaView className="flex-1 bg-[#FCF9F8]">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-3xl font-black text-[#2A5C43]">Farmer Payouts</Text>
        <Text className="text-gray-500 mt-1 mb-5">Disburse earnings via M-Pesa, bank transfer or cash.</Text>

        <View className="flex-row gap-3 mb-4">
          <Metric label="Disbursed" value={`KES ${totals.paidAmount.toLocaleString()}`} icon="check-circle" />
          <Metric label="In Transit" value={`KES ${totals.pendingAmount.toLocaleString()}`} icon="sync" />
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-5">
          <Text className="text-lg font-black text-[#2A5C43] mb-3">New Payout</Text>

          <Pressable
            className="flex-row items-center justify-between bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 py-3.5 mb-3"
            onPress={() => setShowFarmerPicker(true)}
          >
            <Text className={selectedFarmer ? "text-gray-800 font-bold" : "text-gray-400"}>
              {selectedFarmer ? selectedFarmer.name : "Select farmer"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
          </Pressable>

          <TextInput
            className="bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 py-3.5 mb-3 text-gray-800 font-bold"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Amount (KES)"
            placeholderTextColor="#A1A1AA"
          />

          <View className="flex-row gap-2 mb-3">
            {METHODS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setMethod(item)}
                className={`flex-1 border rounded-xl py-3 items-center ${
                  method === item ? "bg-[#2A5C43] border-[#2A5C43]" : "bg-[#F9F9F9] border-gray-200"
                }`}
              >
                <Text className={`font-black capitalize ${method === item ? "text-white" : "text-gray-500"}`}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {method === "mpesa" ? (
            <TextInput
              className="bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 py-3.5 mb-3 text-gray-800 font-bold"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="M-Pesa phone (e.g. 712345678)"
              placeholderTextColor="#A1A1AA"
            />
          ) : null}

          {method === "bank" ? (
            <View className="mb-3">
              <TextInput
                className="bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 py-3.5 mb-3 text-gray-800 font-bold"
                value={bankCode}
                onChangeText={setBankCode}
                placeholder="Bank code (e.g. 000013)"
                placeholderTextColor="#A1A1AA"
              />
              <TextInput
                className="bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 font-bold"
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Account number"
                placeholderTextColor="#A1A1AA"
              />
            </View>
          ) : null}

          <TextInput
            className="bg-[#F9F9F9] border border-gray-200 rounded-xl px-4 py-3.5 mb-3 text-gray-800"
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            placeholderTextColor="#A1A1AA"
          />

          <Pressable
            className={`rounded-xl py-4 items-center ${submitting ? "bg-[#6d9a86]" : "bg-[#2A5C43]"}`}
            onPress={submitPayout}
            disabled={submitting}
          >
            <Text className="text-white font-black">{submitting ? "Processing..." : "Send Payout"}</Text>
          </Pressable>
        </View>

        <Text className="text-xl font-black text-[#2A5C43] mb-2">Payout History</Text>
        {payouts.map((item) => (
          <View key={item.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-black text-[#2A5C43]">{item.farmer || "Farmer"}</Text>
                <Text className="text-gray-700 mt-1 capitalize">{item.method} payout</Text>
              </View>
              <StatusPill status={item.status} />
            </View>
            <Text className="text-gray-900 font-black mt-3">KES {Number(item.amount || 0).toLocaleString()}</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {new Date(item.created_at).toLocaleString()} {item.reference ? `• ${item.reference}` : ""}
            </Text>
            {item.status !== "Paid" && item.status !== "Failed" ? (
              <View className="flex-row gap-2 mt-3">
                <Action label="Mark Paid" onPress={() => updateStatus(item.id, "Paid")} />
                <Action label="Fail" tone="danger" onPress={() => updateStatus(item.id, "Failed")} />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showFarmerPicker} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowFarmerPicker(false)}>
          <View className="bg-white rounded-t-3xl p-4 max-h-[70%]" onStartShouldSetResponder={() => true}>
            <Text className="text-xl font-black text-[#2A5C43] mb-3">Select farmer</Text>
            <ScrollView className="max-h-[60%]">
              {farmers.map((farmer) => (
                <Pressable
                  key={farmer.id}
                  onPress={() => chooseFarmer(farmer)}
                  className="flex-row items-center justify-between px-2 py-3 border-b border-gray-100"
                >
                  <View className="flex-1">
                    <Text className="text-gray-800 font-bold">{farmer.name}</Text>
                    <Text className="text-gray-500 text-sm">{farmer.location || "No location"}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 flex-1 min-w-[150px]">
      <MaterialIcons name={icon} size={21} color="#2A5C43" />
      <Text className="text-[10px] text-gray-500 uppercase font-black mt-3">{label}</Text>
      <Text className="text-[#2A5C43] text-lg font-black mt-1">{value}</Text>
    </View>
  )
}

function StatusPill({ status }: { status: string }) {
  const done = status === "Paid"
  const bad = status === "Failed"
  return (
    <View className={`rounded-full px-3 py-1 ${bad ? "bg-red-100" : done ? "bg-[#E7F5EE]" : "bg-amber-100"}`}>
      <Text className={`text-[11px] font-black uppercase ${bad ? "text-red-700" : done ? "text-[#2A5C43]" : "text-amber-700"}`}>
        {status}
      </Text>
    </View>
  )
}

function Action({
  label,
  onPress,
  tone = "primary"
}: {
  label: string
  onPress: () => void
  tone?: "primary" | "danger"
}) {
  const classes = tone === "primary" ? "bg-[#2A5C43]" : "bg-white border border-red-300"
  const text = tone === "primary" ? "text-white" : "text-red-600"
  return (
    <Pressable onPress={onPress} className={`flex-1 rounded-xl py-3 items-center ${classes}`}>
      <Text className={`font-black ${text}`}>{label}</Text>
    </Pressable>
  )
}
