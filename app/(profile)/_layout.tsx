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

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaView className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0b0b0c] dark:to-[#0f1115]">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="editprofile" />
          <Stack.Screen name="myprofile" />
        </Stack>
        <StatusBar style="auto" />
        <BottomNav safe />
      </SafeAreaView>
    </ThemeProvider>
  );
}
