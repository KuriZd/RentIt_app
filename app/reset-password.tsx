// app/reset-password.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

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

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          Alert.alert(
            "Enlace inválido o expirado",
            "Vuelve a solicitar el restablecimiento de contraseña.",
            [{ text: "Ir a login", onPress: () => router.replace("/auth/login") }]
          );
          setHasRecoverySession(false);
        } else {
          setHasRecoverySession(true);
        }
      } catch {
        Alert.alert(
          "Error",
          "No se pudo validar el enlace. Intenta de nuevo desde tu correo.",
          [{ text: "Ir a login", onPress: () => router.replace("/auth/login") }]
        );
      } finally {
        setCheckingSession(false);
      }
    };

    checkRecoverySession();
  }, [router]);

  const handleReset = async () => {
    if (!hasRecoverySession) {
      Alert.alert(
        "Sesión no válida",
        "El enlace ya no es válido. Solicita un nuevo correo de recuperación."
      );
      return;
    }

    if (!pass || pass.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (pass !== confirm) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: pass });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Éxito",
        "Tu contraseña ha sido actualizada.",
        [{ text: "Ir al login", onPress: () => router.replace("/auth/login") }]
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message ?? "No se pudo actualizar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? "#020617" : "#ffffff" }}
      >
        <ActivityIndicator />
        <Text
          className="mt-3 text-sm"
          style={{ color: COLORS.iconMuted }}
        >
          Validando enlace de recuperación…
        </Text>
      </View>
    );
  }

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
        style={{
          backgroundColor: isDark ? "#0f172a" : "#111827",
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Text className="text-white text-center font-bold">
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </Text>
      </Pressable>
    </View>
  );
}
