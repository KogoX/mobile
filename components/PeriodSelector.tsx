import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type PeriodPreset = "all" | "today" | "week" | "month" | "month_30" | "custom";

export type PeriodFilter = {
  preset: PeriodPreset;
  startDate?: string;
  endDate?: string;
  label: string;
};

interface PeriodSelectorProps {
  selectedPeriod: PeriodFilter;
  onPeriodChange: (filter: PeriodFilter) => void;
  accentColor?: string;
}

export default function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  accentColor = "#2A5C43",
}: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(selectedPeriod.preset === "custom");
  const [customStart, setCustomStart] = useState(selectedPeriod.startDate || "");
  const [customEnd, setCustomEnd] = useState(selectedPeriod.endDate || "");

  const getDatesForPreset = (preset: PeriodPreset): { startDate?: string; endDate?: string; label: string } => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "today") {
      return { startDate: todayStr, endDate: todayStr, label: "Today" };
    }
    if (preset === "week") {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      const startStr = monday.toISOString().split("T")[0];
      return { startDate: startStr, endDate: todayStr, label: "This Week" };
    }
    if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startStr = firstDay.toISOString().split("T")[0];
      return { startDate: startStr, endDate: todayStr, label: "This Month" };
    }
    if (preset === "month_30") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      const startStr = past30.toISOString().split("T")[0];
      return { startDate: startStr, endDate: todayStr, label: "Last 30 Days" };
    }
    return { label: "All Time" };
  };

  const handleSelectPreset = (preset: PeriodPreset) => {
    if (preset === "custom") {
      setShowCustom(!showCustom);
      return;
    }
    setShowCustom(false);
    const dates = getDatesForPreset(preset);
    onPeriodChange({
      preset,
      startDate: dates.startDate,
      endDate: dates.endDate,
      label: dates.label,
    });
  };

  const applyCustomDates = () => {
    if (!customStart) return;
    onPeriodChange({
      preset: "custom",
      startDate: customStart,
      endDate: customEnd || customStart,
      label: `${customStart} to ${customEnd || customStart}`,
    });
  };

  const presets: { id: PeriodPreset; title: string }[] = [
    { id: "all", title: "All Time" },
    { id: "today", title: "Today" },
    { id: "week", title: "This Week" },
    { id: "month", title: "This Month" },
    { id: "month_30", title: "Last 30 Days" },
    { id: "custom", title: "Custom" },
  ];

  return (
    <View className="mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
        {presets.map((item) => {
          const isSelected = selectedPeriod.preset === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelectPreset(item.id)}
              style={{
                backgroundColor: isSelected ? accentColor : "#FFFFFF",
                borderColor: isSelected ? accentColor : "#E5E7EB",
              }}
              className="px-3.5 py-1.5 rounded-full border mr-2 flex-row items-center shadow-sm"
            >
              <Text
                style={{ color: isSelected ? "#FFFFFF" : "#4B5563" }}
                className="text-xs font-bold"
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {showCustom && (
        <View className="bg-white p-3.5 rounded-2xl border border-gray-200 mt-2 shadow-sm">
          <Text className="text-xs font-bold text-gray-700 mb-2">
            Select Custom Date Range (YYYY-MM-DD)
          </Text>
          <View className="flex-row items-center space-x-2">
            <TextInput
              placeholder="Start: 2026-07-01"
              value={customStart}
              onChangeText={setCustomStart}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
            />
            <Text className="text-gray-400 font-bold text-xs">to</Text>
            <TextInput
              placeholder="End: 2026-07-31"
              value={customEnd}
              onChangeText={setCustomEnd}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
            />
            <TouchableOpacity
              onPress={applyCustomDates}
              style={{ backgroundColor: accentColor }}
              className="px-3 py-2 rounded-xl"
            >
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
