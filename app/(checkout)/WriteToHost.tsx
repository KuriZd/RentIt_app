// app/(checkout)/WriteToHost.tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HostParams = {
  hostName?: string;
  since?: string;
  cartId?: string;
  userId?: string; // (ya no lo usamos como host, ahora lo sacamos de articulos)
  paymentMethod?: string;
  message?: string;
  articleId?: string;
};

function buildRoomId(a: string, b: string) {
  return [a, b].sort().join(":");
}

export default function WriteToHostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const hasProfilePhoto = true;

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

  const params = useLocalSearchParams<HostParams>();

  const articleId =
    typeof params.articleId === "string" && params.articleId.length
      ? params.articleId
      : "";

  const cartId =
    typeof params.cartId === "string" && params.cartId.length
      ? params.cartId
      : "";

  const paymentMethod =
    typeof params.paymentMethod === "string" && params.paymentMethod.length
      ? params.paymentMethod
      : "Efectivo";

  const initialHostNameParam =
    typeof params.hostName === "string" && params.hostName.length
      ? params.hostName
      : "Silvia";

  const hostSince =
    typeof params.since === "string" && params.since.length
      ? params.since
      : "Landlord since 2019";

  const initialMessage =
    typeof params.message === "string" ? params.message : "";

  const [message, setMessage] = useState(initialMessage);
  const [hostName, setHostName] = useState(initialHostNameParam);
  const [hostId, setHostId] = useState<string>("");

  // A partir del articleId buscamos el propietario y su nombre
  useEffect(() => {
    let cancelled = false;

    const loadOwnerAndName = async () => {
      if (!articleId) return;

      try {
        const { data: art, error: artErr } = await supabase
          .from("articulos")
          .select("id_propietario")
          .eq("id", articleId)
          .maybeSingle();

        if (artErr) {
          console.error("Error cargando artículo", artErr);
          return;
        }

        if (!art) return;

        const propietarioId = String(
          (art as { id_propietario: string | number | null }).id_propietario ??
          ""
        );

        if (!propietarioId || cancelled) return;

        setHostId(propietarioId);

        const { data: perfil, error: perfilErr } = await supabase
          .from("perfiles")
          .select("nombre")
          .eq("id", propietarioId)
          .maybeSingle();

        if (!perfilErr && perfil && !cancelled) {
          const n = (perfil as { nombre: string | null }).nombre;
          if (n && n.trim().length > 0) {
            setHostName(n);
          }
        }
      } catch (e) {
        console.error("Error cargando propietario", e);
      }
    };

    loadOwnerAndName();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const handleNext = async () => {
    const trimmed = message.trim();

    if (hostId && trimmed.length > 0) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user) {
          const myId = data.user.id;
          const roomId = buildRoomId(myId, hostId);

          const { error: insertErr } = await supabase.from("messages").insert({
            room_id: roomId,
            sender_id: myId,
            content: trimmed,
          });

          if (insertErr) {
            console.error("Error al enviar mensaje al host", insertErr);
          }
        }
      } catch (e) {
        console.error("Error al enviar mensaje al host", e);
      }
    }

    if (hasProfilePhoto) {
      router.push({
        pathname: "/(checkout)/ReservationSummaryScreen",
        params: {
          cartId,
          userId: hostId,
          articleId,
          paymentMethod,
          message,
          hostName,
          since: hostSince,
        },
      });
    } else {
      router.push({
        pathname: "/add-profile-picture",
        params: {
          cartId,
          userId: hostId,
          articleId,
          paymentMethod,
          message,
          initial: (hostName || "O").charAt(0).toUpperCase(),
        },
      });
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: pageBg,
        paddingTop: insets.top + 4,
      }}
    >
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
          Write to the host
        </Text>

        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={20} color={COLORS.icon} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 14,
            color: textColor,
            marginBottom: 4,
          }}
        >
          Tell them about your project and any
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: textColor,
          }}
        >
          questions you may have.
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: COLORS.pill,
          }}
        >
          <Feather name="user" size={14} color={COLORS.iconMuted} />
          <Text
            style={{
              marginLeft: 6,
              fontSize: 12,
              color: textColor,
            }}
          >
            Este mensaje se enviará a{" "}
            <Text style={{ fontWeight: "600" }}>{hostName}</Text>
          </Text>
        </View>
      </View>

      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: COLORS.ring,
          backgroundColor: cardBg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: COLORS.pill,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: COLORS.icon,
            }}
          >
            {hostName.charAt(0)}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: textColor,
            }}
          >
            {hostName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: muted,
              marginTop: 2,
            }}
          >
            {hostSince}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: COLORS.ring,
          backgroundColor: cardBg,
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: 110,
          maxHeight: 180,
          marginBottom: 16,
        }}
      >
        <TextInput
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder={`Hola ${hostName}, soy Oscar...`}
          placeholderTextColor={muted}
          style={{
            fontSize: 14,
            color: textColor,
            textAlignVertical: "top",
          }}
        />
      </View>

      <View style={{ flex: 1 }} />

      <View
        style={{
          height: 3,
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

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 12,
          paddingTop: 8,
        }}
      >
        <Pressable
          onPress={handleNext}
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
