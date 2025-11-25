// app/reset-password.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import { supabase } from "../utils/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleReset = async () => {
    if (!pass || pass.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (pass !== confirm) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: pass });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Éxito", "Tu contraseña ha sido actualizada.");
    router.replace("/auth/login");
  };

  return (
    <View
      className="flex-1 justify-center px-6"
      style={{ backgroundColor: isDark ? "#020617" : "#ffffff" }}
    >
      <Text
        className="text-3xl font-bold mb-4 text-center"
        style={{ color: COLORS.icon }}
      >
        Nueva contraseña
      </Text>

      <TextInput
        secureTextEntry
        placeholder="Nueva contraseña"
        placeholderTextColor={COLORS.iconMuted}
        className="border rounded-xl px-4 py-3 mb-4"
        style={{
          borderColor: COLORS.ring,
          backgroundColor: COLORS.pill,
          color: COLORS.icon,
        }}
        value={pass}
        onChangeText={setPass}
      />

      <TextInput
        secureTextEntry
        placeholder="Confirmar contraseña"
        placeholderTextColor={COLORS.iconMuted}
        className="border rounded-xl px-4 py-3 mb-4"
        style={{
          borderColor: COLORS.ring,
          backgroundColor: COLORS.pill,
          color: COLORS.icon,
        }}
        value={confirm}
        onChangeText={setConfirm}
      />

      <Pressable
        onPress={handleReset}
        disabled={loading}
        className="p-4 rounded-xl"
        style={{ backgroundColor: isDark ? "#0f172a" : "#111827" }}
      >
        <Text className="text-white text-center font-bold">
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </Text>
      </Pressable>
    </View>
  );
}
