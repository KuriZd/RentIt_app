import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import BackButton from "../../components/ui/backbutton";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <SafeAreaView className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0b0b0c] dark:to-[#0f1115]">
        <Stack
          screenOptions={({ navigation }) => ({
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            headerLeft: () =>
              navigation.canGoBack() ? (
                <BackButton
                  style={{ marginBottom: 8 }}
                  size={22}
                />
              ) : null,
          })}
        >
          {/* Ocultamos el header en Home */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Aquí puedes listar tus otras pantallas */}
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="(modals)/new-item" />
        </Stack>

        <StatusBar style={isDark ? "light" : "dark"} />
        <BottomNav safe />
      </SafeAreaView>
    </ThemeProvider>
  );
}
