import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScanTicketScreen() {
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
      overlay: "rgba(0,0,0,0.60)",
    }),
    [isDark]
  );

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;
    setScanned(true);

    try {
      setValidating(true);

      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        throw new Error("Formato de QR inválido.");
      }

      const reservationId = parsed?.reservationId;
      if (!reservationId) {
        throw new Error("El ticket no contiene una reservación válida.");
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error("No hay sesión activa.");
      }
      const ownerId = authData.user.id;

      const { data: reserva, error: reservaError } = await supabase
        .from("reservaciones")
        .select(
          `
        id,
        id_articulo,
        ticket_validado,
        articulos (
          id,
          id_propietario
        )
      `
        )
        .eq("id", reservationId)
        .maybeSingle();

      if (reservaError) throw reservaError;
      if (!reserva) throw new Error("Reservación no encontrada.");

      const art = reserva.articulos?.[0];
      if (!art || art.id_propietario !== ownerId) {
        throw new Error(
          "Este ticket no corresponde a un artículo de tu propiedad."
        );
      }

      if (reserva.ticket_validado) {
        Alert.alert("Ticket ya validado", "Este ticket ya fue usado.");
        return;
      }

      const { error: updateError } = await supabase
        .from("reservaciones")
        .update({
          ticket_validado: true,
        })
        .eq("id", reservationId);

      if (updateError) throw updateError;

      Alert.alert(
        "Entrega validada",
        "La reservación ha sido marcada como entregada."
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo validar el ticket.");
    } finally {
      setValidating(false);
      setTimeout(() => setScanned(false), 1500);
    }
  };

  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? "#020617" : "#f9fafb",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#a1a1aa",
          }}
        >
          Verificando permisos de cámara…
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? "#020617" : "#f9fafb",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            textAlign: "center",
            color: isDark ? "#e5e7eb" : "#111827",
            marginBottom: 12,
          }}
        >
          No se ha otorgado permiso para usar la cámara.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: COLORS.pill,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: COLORS.icon,
            }}
          >
            Conceder permiso
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 8,
        backgroundColor: "#000000",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            height: 36,
            width: 36,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.overlay,
          }}
        >
          <Feather name="x" size={20} color="#ffffff" />
        </Pressable>

        <View style={{ marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            Escanear ticket
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#d4d4d8",
            }}
          >
            Apunta la cámara al código QR del renter
          </Text>
        </View>
      </View>

      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {validating && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: insets.bottom + 40,
            alignItems: "center",
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: COLORS.overlay,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ActivityIndicator color="#ffffff" />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 12,
                color: "#ffffff",
              }}
            >
              Validando ticket…
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
