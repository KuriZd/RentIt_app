// app/(checkout)/add-profile-picture.tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddProfilePictureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  const pageBg = isDark ? "#020617" : "#f9fafb";
  const cardBg = isDark ? "#020617" : "#ffffff";
  const textColor = isDark ? "#e5e7eb" : "#111827";
  const muted = isDark ? "#9ca3af" : "#6b7280";

  const params = useLocalSearchParams<{
    initial?: string;
    photoUrl?: string;
  }>();

  const initial =
    (typeof params.initial === "string" && params.initial) || "O";

  const [photoUri] = useState<string | null>(
    (typeof params.photoUrl === "string" && params.photoUrl) || null
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: pageBg,
        paddingTop: insets.top + 4,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={COLORS.icon} />
        </Pressable>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: textColor,
          }}
        >
          Add a profile picture
        </Text>

        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={20} color={COLORS.icon} />
        </Pressable>
      </View>

      {/* Avatar + botón */}
      <View
        style={{
          alignItems: "center",
          marginTop: 32,
        }}
      >
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: "#000000",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "100%", borderRadius: 999 }}
            />
          ) : (
            <Text
              style={{
                fontSize: 72,
                fontWeight: "700",
                color: "#ffffff",
              }}
            >
              {initial.toUpperCase()}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            // aquí luego conectas el image picker
          }}
          style={{
            marginTop: -18,
            paddingHorizontal: 18,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "#0284c7",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            Change Photo
          </Text>
        </Pressable>
      </View>

      {/* Texto descriptivo */}
      <View
        style={{
          marginTop: 40,
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: textColor,
            textAlign: "center",
          }}
        >
          Add a photo of your beautiful face, the landlord would like to meet
          you.
        </Text>
      </View>

      {/* Barra de progreso */}
      <View
        style={{
          height: 3,
          marginTop: "auto",
          flexDirection: "row",
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000",
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? "#27272a" : "#e5e7eb",
          }}
        />
      </View>

      {/* Botón Next */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 12,
          paddingTop: 8,
          backgroundColor: pageBg,
        }}
      >
        <Pressable
          onPress={() => {
            // aquí mandas a la siguiente pantalla del flujo
            // por ejemplo: router.push("/checkout/summary")
          }}
          style={{
            height: 48,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.icon,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: isDark ? "#020617" : "#f9fafb",
            }}
          >
            Next
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
