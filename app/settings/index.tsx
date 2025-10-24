// app/settings/index.tsx
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

/* ---------------- Item tipo botón ---------------- */
type SettingItemProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
};
function SettingItem({ icon, label, onPress, danger }: SettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      android_ripple={{
        color: danger ? "rgba(220,38,38,0.1)" : "rgba(0,0,0,0.06)",
      }}
      className={[
        "mb-3 flex-row items-center justify-between rounded-xl border px-4 py-4 shadow-sm",
        "bg-white dark:bg-zinc-900",
        danger
          ? "border-red-300/80 dark:border-red-500/40"
          : "border-zinc-200 dark:border-zinc-800",
        Platform.OS === "web"
          ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
          : "",
      ].join(" ")}
      style={
        Platform.OS === "android"
          ? { elevation: 0 } // borde manda en dark, sin sombra
          : {
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }
      }
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text
          className={[
            "text-base",
            danger
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-800 dark:text-zinc-100",
          ].join(" ")}
        >
          {label}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={danger ? "#dc2626" : undefined /* se ajusta en el padre */}
      />
    </Pressable>
  );
}

/* ---------------- Item con switch ---------------- */
type SettingSwitchProps = {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
};
function SettingSwitch({
  icon,
  label,
  value,
  onValueChange,
}: SettingSwitchProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (
    <View
      className={[
        "mb-3 flex-row items-center justify-between rounded-xl border px-4 py-4 shadow-sm",
        "bg-white dark:bg-zinc-900",
        "border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
      style={
        Platform.OS === "android"
          ? { elevation: 0 }
          : {
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }
      }
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-base text-zinc-800 dark:text-zinc-100">
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        ios_backgroundColor={isDark ? "#3f3f46" : "#e5e7eb"}
        trackColor={{
          false: isDark ? "#3f3f46" : "#d4d4d8",
          true: isDark ? "#14532d" : "#a7f3d0",
        }}
        thumbColor={
          Platform.OS === "android"
            ? value
              ? isDark
                ? "#16a34a"
                : "#10b981"
              : isDark
                ? "#a1a1aa"
                : "#f9fafb"
            : undefined
        }
        style={
          Platform.OS === "ios" ? { transform: [{ scale: 1.05 }] } : undefined
        }
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const COLORS = useMemo(
    () => ({
      bg: isDark ? "#0b0b0c" : "#f9fafb", // zinc-50 en claro, near-black en dark
      icon: isDark ? "#e5e7eb" : "#111827", // textos/íconos principales
      chevron: isDark ? "#9ca3af" : "#6b7280", // secundaria
      accent: "#2563eb",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
    }),
    [isDark]
  );

  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(false);

  // cargar preferencia
  useEffect(() => {
    AsyncStorage.getItem("hapticsEnabled").then((val) => {
      if (val !== null) setHapticsEnabled(val === "true");
    });
  }, []);

  const toggleHaptics = useCallback(async (value: boolean) => {
    setHapticsEnabled(value);
    await AsyncStorage.setItem("hapticsEnabled", String(value));
    if (value) {
      try {
        await Haptics.selectionAsync();
      } catch {}
    }
  }, []);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            // TODO: Llamar tu endpoint real de borrado de cuenta
            Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada.");
          },
        },
      ]
    );
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error al cerrar sesión", error.message);
      return;
    }
    await AsyncStorage.clear();
    router.replace("/");
  }, [router]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
      >
        {/* Header */}
        <View className="mt-20 mb-8 flex-row items-center gap-4">
          <View className="relative">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0",
              }}
              accessibilityLabel="User avatar"
              className="mb-3 h-16 w-16 rounded-full"
            />
            {/* ring sutil según tema */}
            <View
              className="absolute -inset-[2px] rounded-full"
              style={{ borderWidth: 2, borderColor: COLORS.ring }}
              pointerEvents="none"
            />
          </View>
          <Text className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            Monsterrat Herrera
          </Text>
        </View>

        {/* Items */}
        <SettingItem
          icon={<Feather name="user" size={20} color={COLORS.icon} />}
          label="Edit Profile"
          onPress={() => router.push("/editprofile")}
        />
        <SettingItem
          icon={<Feather name="help-circle" size={20} color={COLORS.icon} />}
          label="Help"
          onPress={() => router.push("/settings/help")}
        />
        <SettingItem
          icon={<AntDesign name="global" size={20} color={COLORS.icon} />}
          label="Language Settings"
          onPress={() => router.push("/settings/language")}
        />
        <SettingItem
          icon={<Feather name="lock" size={20} color={COLORS.icon} />}
          label="Authentication"
          onPress={() => router.push("/settings/auth")}
        />
        <SettingItem
          icon={<Feather name="bell" size={20} color={COLORS.icon} />}
          label="Notifications"
          onPress={() => router.push("/settings/notifications")}
        />

        <SettingItem
          icon={
            <MaterialIcons name="delete-outline" size={22} color="#dc2626" />
          }
          label="Delete Account"
          danger
          onPress={confirmDelete}
        />

        <SettingSwitch
          icon={<Feather name="smartphone" size={20} color={COLORS.icon} />}
          label="Haptic feedback"
          value={hapticsEnabled}
          onValueChange={toggleHaptics}
        />

        <SettingItem
          icon={<Feather name="log-out" size={20} color={COLORS.icon} />}
          label="Log out"
          onPress={handleLogout}
        />

        {/* Chevron de todos los items a color de tema */}
        <View className="h-0">
          {/* Este View vacío es solo para “usar” COLORS.chevron y evitar tree-shake en plataformas */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
