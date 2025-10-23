// app/settings/index.tsx
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../utils/supabase";

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
      className={[
        "flex-row items-center justify-between rounded-xl border px-4 py-4 mb-3 shadow-sm",
        "bg-white dark:bg-zinc-900",
        danger
          ? "border-red-300/80 dark:border-red-500/40"
          : "border-zinc-200 dark:border-zinc-800",
        Platform.OS === "web" ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/60" : "",
      ].join(" ")}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text
          className={[
            "text-base",
            danger ? "text-red-600 dark:text-red-400" : "text-zinc-800 dark:text-zinc-100",
          ].join(" ")}
        >
          {label}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={danger ? "#dc2626" : Platform.OS === "ios" ? "#8E8E93" : "#6b7280"}
      />
    </Pressable>
  );
}

type SettingSwitchProps = {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
};
function SettingSwitch({ icon, label, value, onValueChange }: SettingSwitchProps) {
  const scheme = useColorScheme();
  return (
    <View
      className={[
        "flex-row items-center justify-between rounded-xl border px-4 py-4 mb-3 shadow-sm",
        "bg-white dark:bg-zinc-900",
        "border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-base text-zinc-800 dark:text-zinc-100">{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? (scheme === "dark" ? "#16a34a" : "#10b981") : undefined}
        trackColor={{ false: scheme === "dark" ? "#3f3f46" : "#d4d4d8", true: scheme === "dark" ? "#14532d" : "#a7f3d0" }}
        ios_backgroundColor={scheme === "dark" ? "#3f3f46" : "#e5e7eb"}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
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
      // vibración suave solo al activar
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
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-black">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-8 mt-20">
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0",
            }}
            accessibilityLabel="User avatar"
            className="h-16 w-16 rounded-full mb-3"
          />
          <Text className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            Monsterrat Herrera
          </Text>
        </View>

        {/* Items */}
        <SettingItem
          icon={<Feather name="user" size={20} color="#111" />}
          label="Edit Profile"
          onPress={() => router.push("/settings/viewprofile" as any)}
        />
        <SettingItem
          icon={<Feather name="help-circle" size={20} color="#111" />}
          label="Help"
          onPress={() => router.push("/settings/help" as any)}
        />
        <SettingItem
          icon={<AntDesign name="global" size={20} color="#111" />}
          label="Language Settings"
          onPress={() => router.push("/settings/language" as any)}
        />
        <SettingItem
          icon={<Feather name="lock" size={20} color="#111" />}
          label="Authentication"
          onPress={() => router.push("/settings/auth" as any)}
        />
        <SettingItem
          icon={<Feather name="bell" size={20} color="#111" />}
          label="Notifications"
          onPress={() => router.push("/settings/notifications" as any)}
        />

        <SettingItem
          icon={<MaterialIcons name="delete-outline" size={22} color="#dc2626" />}
          label="Delete Account"
          danger
          onPress={confirmDelete}
        />

        <SettingSwitch
          icon={<Feather name="smartphone" size={20} color="#111" />}
          label="Haptic feedback"
          value={hapticsEnabled}
          onValueChange={toggleHaptics}
        />

        <SettingItem
          icon={<Feather name="log-out" size={20} color="#111" />}
          label="Log out"
          onPress={handleLogout}
        />
      </ScrollView>

      {/* bottom nav */}
      <BottomNav />
    </SafeAreaView>
  );
}
