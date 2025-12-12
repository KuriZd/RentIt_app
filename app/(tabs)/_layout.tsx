// app/(tabs)/_layout.tsx
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../../components/BottomNav";
import { registerForPushNotificationsAsync } from "../../utils/notifications";
import { supabase } from "../../utils/supabase";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🔔 Registrar token de push cuando el usuario entra a las tabs
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token || cancelled) return;

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (__DEV__) console.log("Error getUser:", error);
        return;
      }

      const userId = data.user?.id;
      if (!userId) return;

      // Guardar / actualizar el token en el perfil
      const { error: upsertError } = await supabase
        .from("perfiles")
        .update({ expo_push_token: token })
        .eq("id", userId);

      if (upsertError && __DEV__) {
        console.log("Error guardando expo_push_token:", upsertError);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <SafeAreaView className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0b0b0c] dark:to-[#0f1115]">
        <Stack screenOptions={{ headerShown: false }}>
          {/* Home */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Otras pantallas dentro de tabs */}
          <Stack.Screen name="settings" />
          <Stack.Screen name="(modals)/new-item" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
        <BottomNav safe />
      </SafeAreaView>
    </ThemeProvider>
  );
}

