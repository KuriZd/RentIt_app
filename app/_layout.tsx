// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export const unstable_settings = { anchor: '(tabs)' };

// 👇 Solo estas dos rutas serán válidas para Redirect
type Target = '/' | '/Onboarding';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [target, setTarget] = React.useState<Target | null>(null);

  React.useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('firstLaunchDone');
      setTarget(seen ? '/' : '/Onboarding');
    })();
  }, []);

  if (!target) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Redirect href={target} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="Onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
