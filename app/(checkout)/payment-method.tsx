// app/(checkout)/payment-method.tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Pressable,
    StatusBar,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MethodKey = "card" | "paypal" | "cash";

type Params = {
  cartId?: string;
  userId?: string;
  articleId?: string; // 👈 añadimos el id del artículo
};

export default function PaymentMethodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { cartId, userId, articleId } = useLocalSearchParams<Params>(); // 👈 leemos articleId

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

  const [selected, setSelected] = useState<MethodKey>("cash"); // efectivo por defecto

  const bg = isDark ? "#020617" : "#ffffff";
  const pageBg = isDark ? "#020617" : "#f9fafb";
  const textColor = isDark ? "#e5e7eb" : "#111827";
  const muted = isDark ? "#9ca3af" : "#6b7280";

  const renderRadio = (active: boolean, disabled?: boolean) => (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: disabled ? muted : COLORS.icon,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: disabled ? muted : COLORS.icon,
          }}
        />
      )}
    </View>
  );

  const MethodRow = ({
    label,
    description,
    icon,
    disabled,
    methodKey,
  }: {
    label: string;
    description?: string;
    icon: keyof typeof Feather.glyphMap;
    disabled?: boolean;
    methodKey: MethodKey;
  }) => {
    const active = selected === methodKey;
    return (
      <Pressable
        disabled={disabled}
        onPress={() => setSelected(methodKey)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: COLORS.pill,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Feather
            name={icon}
            size={20}
            color={disabled ? COLORS.iconMuted : COLORS.icon}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: disabled ? muted : textColor,
            }}
          >
            {label}
          </Text>
          {!!description && (
            <Text
              style={{
                fontSize: 12,
                marginTop: 2,
                color: muted,
              }}
            >
              {description}
            </Text>
          )}
        </View>

        {renderRadio(active, disabled)}
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: pageBg,
        paddingTop: insets.top + 4,
      }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
          Add a payment method
        </Text>

        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={20} color={COLORS.icon} />
        </Pressable>
      </View>

      {/* Card métodos */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: COLORS.ring,
          backgroundColor: bg,
          overflow: "hidden",
        }}
      >
        {/* Tarjeta (deshabilitada) */}
        <MethodRow
          label="Tarjeta de crédito o débito"
          description="VISA · AMEX · DISCOVER"
          icon="credit-card"
          disabled
          methodKey="card"
        />

        <View
          style={{
            height: 1,
            marginHorizontal: 16,
            backgroundColor: COLORS.ring,
            opacity: 0.4,
          }}
        />

        {/* PayPal (deshabilitado) */}
        <MethodRow label="PayPal" icon="globe" disabled methodKey="paypal" />

        <View
          style={{
            height: 1,
            marginHorizontal: 16,
            backgroundColor: COLORS.ring,
            opacity: 0.4,
          }}
        />

        {/* Efectivo (único disponible) */}
        <MethodRow
          label="Efectivo"
          description="Paga al momento de recibir el producto"
          icon="dollar-sign"
          methodKey="cash"
        />
      </View>

      {/* Mensaje informativo */}
      <Text
        style={{
          marginHorizontal: 24,
          marginTop: 16,
          fontSize: 13,
          color: muted,
        }}
      >
        Por el momento solo está disponible el pago en efectivo.
      </Text>

      {/* Botón Next */}
      <View
        style={{
          marginTop: "auto",
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <Pressable
          onPress={() => {
            // Pasamos cartId, userId, articleId y el método seleccionado
            router.push({
              pathname: "/WriteToHost", 
              params: {
                cartId: cartId ?? "",
                userId: userId ?? "",
                articleId: articleId ?? "", 
                paymentMethod: "Efectivo", 
              },
            });
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
