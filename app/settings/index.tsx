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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type SettingItemProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

type SettingSwitchProps = {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
};

type Perfil = {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  email: string | null;
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
        color={danger ? "#dc2626" : undefined}
      />
    </Pressable>
  );
}

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
  const insets = useSafeAreaInsets();
  const isDark = scheme === "dark";

  const COLORS = useMemo(
    () => ({
      bg: isDark ? "#0b0b0c" : "#f9fafb",
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
    }),
    [isDark]
  );

  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(false);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [hasPublishedArticles, setHasPublishedArticles] =
    useState<boolean>(false);

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
      } catch { }
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        Alert.alert(
          "Error",
          "No se pudo obtener la sesión del usuario. Intenta nuevamente."
        );
        return;
      }

      if (!user) return;

      const { data: perfilData, error: perfilError } = await supabase
        .from("perfiles")
        .select("id, nombre, avatar_url, email")
        .eq("id", user.id)
        .single();

      if (!perfilError && perfilData) {
        setProfile(perfilData as Perfil);
      }

      const { data: articulosData, error: articulosError } = await supabase
        .from("articulos")
        .select("id")
        .eq("id_propietario", user.id)
        .eq("estado_publicacion", "publicado")
        .limit(1);

      if (articulosError) {
        console.error(articulosError);
      } else {
        setHasPublishedArticles(
          Boolean(articulosData && articulosData.length > 0)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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

  const avatarUri =
    profile?.avatar_url ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0";

  const displayName =
    profile?.nombre || profile?.email || "Usuario de RentIt";

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: COLORS.bg }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24 + Math.max(insets.bottom, 0),
          paddingTop: 12 + Math.max(insets.top, 0),
        }}
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "automatic" : undefined
        }
      >
        <View className="mb-8 flex-row items-center gap-4">
          <View className="relative">
            <Image
              source={{ uri: avatarUri }}
              accessibilityLabel="User avatar"
              className="h-16 w-16 rounded-full"
            />
            <View
              className="absolute -inset-[2px] rounded-full"
              style={{ borderWidth: 2, borderColor: COLORS.ring }}
              pointerEvents="none"
            />
          </View>

          <View className="flex-1">
            <Text className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
              {displayName}
            </Text>

            {profile?.email && (
              <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {profile.email}
              </Text>
            )}

            {loadingProfile && (
              <Text className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Cargando perfil...
              </Text>
            )}
          </View>
        </View>

        {hasPublishedArticles && (
          <>
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Mis artículos
            </Text>
            <SettingItem
              icon={
                <Feather name="shopping-bag" size={20} color={COLORS.icon} />
              }
              label="Mis artículos en renta"
              onPress={() => router.push("/settings/myitems")}
            />
          </>
        )}

        <SettingItem
          icon={<Feather name="user" size={20} color={COLORS.icon} />}
          label="Profile"
          onPress={() => router.push("/myprofile")}
        />
        <SettingItem
          icon={<Feather name="help-circle" size={20} color={COLORS.icon} />}
          label="Help"
          onPress={() => router.push("/settings/help")}
        />
        <SettingItem
          icon={<AntDesign name="global" size={20} color={COLORS.icon} />}
          label="History"
          onPress={() => router.push("/settings/history")}
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
          icon={<MaterialIcons name="delete-outline" size={22} color="#dc2626" />}
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
      </ScrollView>
    </SafeAreaView>
  );
}
