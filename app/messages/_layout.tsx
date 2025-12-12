// app/(tabs)/_layout.tsx (o donde tengas este layout)
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";

import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../../utils/notifications";
import { supabase } from "../../utils/supabase";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  React.useEffect(() => {
    let subscription: Notifications.Subscription | undefined;

    (async () => {
      // 1) Pedimos el token de Expo
      const token = await registerForPushNotificationsAsync();
      if (token) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // 2) Guardamos el token en la tabla perfiles
            // Asegúrate de tener columna expo_push_token en perfiles
            await supabase
              .from("perfiles")
              .update({ expo_push_token: token })
              .eq("id", user.id);
          }
        } catch (e) {
          console.log("Error guardando expo_push_token:", e);
        }
      }

      // 3) Cuando el usuario toca la notificación
      subscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as any;
          const roomId = data?.roomId || data?.room_id;

          if (roomId) {
            // navegamos al chat correspondiente
            router.push(`/messages/${roomId}`);
          }
        });
    })();

    return () => {
      subscription?.remove();
    };
  }, [router]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <SafeAreaView className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0b0b0c] dark:to-[#0f1115]">
        <Stack screenOptions={{ headerShown: false }}>
          {/* Ocultamos el header en Home */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Aquí puedes listar tus otras pantallas */}
          <Stack.Screen name="settings" />
          <Stack.Screen name="(modals)/new-item" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
        <BottomNav safe />
      </SafeAreaView>
    </ThemeProvider>
  );
}
