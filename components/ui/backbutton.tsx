import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, useColorScheme, ViewStyle } from "react-native";

type Props = {
  size?: number;
  style?: ViewStyle;
};

export default function BackButton({ size = 22, style }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🎨 Paleta dinámica
  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
    }),
    [isDark]
  );

  // sombra adaptada
  const shadow =
    Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }
      : { elevation: 4 };

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      className="rounded-full p-2 active:opacity-80"
      style={[
        {
          backgroundColor: COLORS.pill,
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        },
        shadow,
        style,
      ]}
    >
      <Feather name="chevron-left" size={size} color={COLORS.icon} />
    </Pressable>
  );
}
