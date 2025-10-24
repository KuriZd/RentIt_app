import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Channel = "app" | "email" | "whatsapp";

type SettingItem = {
  id: string;
  title: string;
  description: string;
};

const BASE_ITEMS: SettingItem[] = [
  {
    id: "reminders",
    title: "Recordatorios",
    description:
      "Put a description in this section, specifying what happens if you click on it.",
  },
  {
    id: "promos",
    title: "Promociones",
    description:
      "Put a description in this section, specifying what happens if you click on it.",
  },
  {
    id: "updates",
    title: "Actualizaciones",
    description:
      "Put a description in this section, specifying what happens if you click on it.",
  },
  {
    id: "alarms ",
    title: "Alarmas",
    description:
      "Put a description in this section, specifying what happens if you click on it.",
  },
  {
    id: "out of stock",
    title: "Sin stock",
    description:
      "Put a description in this section, specifying what happens if you click on it.",
  },
];

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Paleta derivada del tema (sin negros puros en dark para no “aplastar”)
  const COLORS = {
    bg: isDark ? "#0a0a0a" : "#ffffff",
    text: isDark ? "#e5e5e5" : "#171717",
    textMuted: isDark ? "#d4d4d8" : "#525252",
    border: isDark ? "#27272a" : "#e5e7eb",
    divider: isDark ? "#27272a" : "#e5e7eb",
    cardBg: isDark ? "#111113" : "#ffffff",
    pillBgActive: isDark ? "#1f1f22" : "#f3f4f6",
    pillBg: isDark ? "#0f0f10" : "#ffffff",
    pillBorder: isDark ? "#3f3f46" : "#e5e7eb",
    accent: "#4f46e5", // indigo-600
    accentTrack: isDark ? "#6366f1" : "#a5b4fc", // track ON
    trackOff: isDark ? "#3f3f46" : "#d4d4d4", // track OFF
    thumbOn: isDark ? "#e5e7eb" : "#4f46e5",
    thumbOff: isDark ? "#a1a1aa" : "#f9fafb",
  };

  const [channel, setChannel] = useState<Channel>("app");
  const [values, setValues] = useState<
    Record<Channel, Record<string, boolean>>
  >({
    app: { reminders: true, promos: true, updates: true },
    email: { reminders: false, promos: true, updates: false },
    whatsapp: { reminders: true, promos: false, updates: true },
  });

  const items = useMemo(() => BASE_ITEMS, []);

  const toggle = (id: string, next: boolean) => {
    setValues((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [id]: next },
    }));
  };

  const Pill = ({ c, label }: { c: Channel; label: string }) => {
    const active = c === channel;
    return (
      <Pressable
        onPress={() => setChannel(c)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        android_ripple={{
          color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          borderless: true,
        }}
        className="rounded-full"
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: COLORS.pillBorder,
          backgroundColor: active ? COLORS.pillBgActive : COLORS.pillBg,
        }}
      >
        <Text
          className="text-[15px]"
          style={{
            color: active ? COLORS.text : COLORS.textMuted,
            fontWeight: active ? "700" : "500",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const Row = ({ it }: { it: SettingItem }) => {
    const v = values[channel]?.[it.id] ?? false;
    return (
      <View className="px-5 py-4">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text
              className="text-[17px] font-semibold"
              style={{ color: COLORS.text }}
            >
              {it.title}
            </Text>
            <Text
              className="mt-1 text-[14px] leading-6"
              style={{ color: COLORS.textMuted }}
            >
              {it.description}
            </Text>
          </View>

          <Switch
            value={v}
            onValueChange={(next) => toggle(it.id, next)}
            trackColor={{ false: COLORS.trackOff, true: COLORS.accentTrack }}
            thumbColor={
              Platform.OS === "android"
                ? v
                  ? COLORS.thumbOn
                  : COLORS.thumbOff
                : undefined
            }
            ios_backgroundColor={COLORS.trackOff}
            style={
              Platform.OS === "ios"
                ? { transform: [{ scale: 1.05 }] }
                : undefined
            }
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="px-5 pt-10">
          <Text className="text-4xl font-bold" style={{ color: COLORS.text }}>
            Notifications
          </Text>
          <Text
            className="mt-3 text-[15px] leading-6"
            style={{ color: COLORS.textMuted }}
          >
            Here you can choose what types of notifications you want to receive
            in your email and via notifications on your cell phone.
          </Text>
        </View>

        {/* Segmented control */}
        <View className="px-5 mt-5">
          <View className="flex-row gap-3">
            <Pill c="app" label="App" />
            <Pill c="email" label="Email" />
            <Pill c="whatsapp" label="WhatsApp" />
          </View>
        </View>

        {/* Card container for list */}
        <View
          className="mt-6 mx-5 rounded-2xl"
          style={{
            backgroundColor: COLORS.cardBg,
            borderWidth: 1,
            borderColor: COLORS.border,
            // sutil elevación en claro; en dark prioriza borde
            ...(Platform.OS === "android"
              ? { elevation: isDark ? 0 : 2 }
              : {
                  shadowColor: isDark ? "transparent" : "#000",
                  shadowOpacity: isDark ? 0 : 0.06,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }),
          }}
        >
          {items.map((it, idx) => (
            <View key={`${channel}-${it.id}`}>
              <Row it={it} />
              {idx < items.length - 1 ? (
                <View
                  className="mx-5 h-px"
                  style={{ backgroundColor: COLORS.divider }}
                />
              ) : null}
            </View>
          ))}
        </View>

        {/* Footer help text */}
        <View className="px-5 mt-6">
          <Text
            className="text-[13px] leading-6"
            style={{ color: isDark ? "#a1a1aa" : "#6b7280" }}
          >
            You can change these preferences at any time. Some notifications are
            required for account security.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
