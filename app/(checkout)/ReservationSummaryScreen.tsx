// app/(checkout)/summary.tsx

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type UnidadPrecio = "hora" | "dia" | "semana";

type SummaryParams = {
  cartId?: string;
  userId?: string;      // uid del renter (quien renta)
  paymentMethod?: string;
  message?: string;
  hostName?: string;
  since?: string;
  articleId?: string;   // 👈 nuevo: para poder llegar al propietario
};

type CartItemRow = {
  id: string;
  id_carrito: string;
  id_articulo: number;
  titulo_cached: string | null;
  image_url: string | null;
  precio: number;
  unidad: UnidadPrecio | null;
  periodo_cantidad: number | null;
  qty: number | null;
  metodo: string | null;
  tarifa_entrega: number | null;
  solo_retiro: boolean | null;
  entrega_disponible: boolean | null;
  disponible: boolean | null;
};

const CART_ITEMS_SELECT = `
  id,
  id_carrito,
  id_articulo,
  titulo_cached,
  image_url,
  precio,
  unidad,
  periodo_cantidad,
  qty,
  metodo,
  tarifa_entrega,
  solo_retiro,
  entrega_disponible,
  disponible
`;

function addPeriods(base: Date, unit: UnidadPrecio, periods: number): Date {
  const d = new Date(base);
  switch (unit) {
    case "hora":
      d.setHours(d.getHours() + periods);
      break;
    case "semana":
      d.setDate(d.getDate() + periods * 7);
      break;
    case "dia":
    default:
      d.setDate(d.getDate() + periods);
      break;
  }
  return d;
}

export default function ReservationSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const params = useLocalSearchParams<SummaryParams>();

  const cartId =
    typeof params.cartId === "string" && params.cartId.length
      ? params.cartId
      : "";
  const userId =
    typeof params.userId === "string" && params.userId.length
      ? params.userId
      : "";
  const articleId =
    typeof params.articleId === "string" && params.articleId.length
      ? params.articleId
      : "";
  const methodLabel =
    typeof params.paymentMethod === "string" && params.paymentMethod.length
      ? params.paymentMethod
      : "Efectivo";
  const message =
    typeof params.message === "string" && params.message.length
      ? params.message
      : "";

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

  const [confirming, setConfirming] = useState(false);
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!cartId) return;
    (async () => {
      try {
        setLoadingItems(true);
        const { data, error } = await supabase
          .from("cart_items")
          .select(CART_ITEMS_SELECT)
          .eq("id_carrito", cartId);

        if (error) throw error;
        setItems((data ?? []) as CartItemRow[]);
      } catch (e) {
        console.log("Error loading cart items for summary", e);
      } finally {
        setLoadingItems(false);
      }
    })();
  }, [cartId]);

  const computedSubtotal = items.reduce((acc, it) => {
    const price = Number(it.precio ?? 0);
    const qty = it.qty ?? 1;
    return acc + price * qty;
  }, 0);

  const fallbackSubtotal = 20;
  const fallbackTaxes = 4.6;

  const priceSubtotal = items.length ? computedSubtotal : fallbackSubtotal;
  const priceTaxes = items.length ? priceSubtotal * 0.16 : fallbackTaxes;
  const priceTotal = priceSubtotal + priceTaxes;

  const itemsCount = items.length || 1;

  const previewMessage =
    message && message.length > 40
      ? message.slice(0, 40) + "..."
      : message || "Hello Silvia, I am Oscar";

  const SummaryRow = ({
    title,
    subtitle,
    buttonLabel,
    onPress,
  }: {
    title: string;
    subtitle: string;
    buttonLabel?: string;
    onPress?: () => void;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: textColor,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            marginTop: 2,
            color: muted,
          }}
        >
          {subtitle}
        </Text>
      </View>
      {buttonLabel && (
        <Pressable
          onPress={onPress}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: COLORS.pill,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: textColor,
            }}
          >
            {buttonLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );

  const Divider = () => (
    <View
      style={{
        height: 1,
        backgroundColor: COLORS.ring,
        marginVertical: 6,
        opacity: 0.5,
      }}
    />
  );

  const handleConfirm = async () => {
    if (!cartId) {
      Alert.alert(
        "Error",
        "No se encontró la información del carrito. Intenta de nuevo."
      );
      return;
    }

    if (!items.length) {
      Alert.alert(
        "Carrito vacío",
        "No hay artículos en el carrito para reservar."
      );
      return;
    }

    try {
      setConfirming(true);

      // Igual que en cart: tomamos el uid del usuario autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Debes iniciar sesión para confirmar la reservación.");
      }
      const userId = userData.user.id;

      const now = new Date();

      // Mismas reglas que en cart/index.tsx, pero usando CartItemRow
      const reservas = items.map((it) => {
        const unidad = (it.unidad ?? "dia") as UnidadPrecio;
        const qty = it.qty ?? 1;
        const periodQty = it.periodo_cantidad ?? 1;
        const totalPeriods = qty * periodQty;

        const fecha_inicio = now.toISOString();
        const fecha_fin = addPeriods(now, unidad, totalPeriods).toISOString();

        const precio_unitario = Number(it.precio);
        const cantidad = totalPeriods;
        const subtotalRow = precio_unitario * cantidad;

        const tarifa_entrega = it.tarifa_entrega
          ? Number(it.tarifa_entrega)
          : 0;
        const deposito_cobrado = 0;
        const comision_plataforma = 0;

        const totalRow =
          subtotalRow + tarifa_entrega + deposito_cobrado + comision_plataforma;

        const entrega_solicitada =
          !!it.entrega_disponible && !it.solo_retiro;

        return {
          id_usuario: userId,
          id_articulo: it.id_articulo,
          fecha_inicio,
          fecha_fin,
          precio_unitario,
          unidad_precio: unidad,
          cantidad,
          entrega_solicitada,
          tarifa_entrega,
          deposito_cobrado,
          subtotal: subtotalRow,
          comision_plataforma,
          total: totalRow,
          estado_reservacion: "pendiente",
          notas: message || null,
        };
      });

      const { error: insertError } = await supabase
        .from("reservaciones")
        .insert(reservas);

      if (insertError) throw insertError;

      // Igual que en cart: marcar carrito como ordered y limpiar items
      await supabase
        .from("carts")
        .update({ status: "ordered" })
        .eq("id", cartId);

      await supabase
        .from("cart_items")
        .delete()
        .eq("id_carrito", cartId);

      Alert.alert("Reservación creada", "Tus artículos han sido reservados.");
      router.replace("/main");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message ?? "No se pudo confirmar la reservación."
      );
    } finally {
      setConfirming(false);
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
          Review your request
        </Text>

        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={20} color={COLORS.icon} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.ring,
            backgroundColor: cardBg,
            padding: 12,
            marginBottom: 16,
          }}
        >
          {loadingItems && (
            <Text
              style={{
                fontSize: 11,
                marginBottom: 6,
                color: muted,
              }}
            >
              Loading cart items…
            </Text>
          )}

          {items.length === 0 ? (
            <View
              style={{
                flexDirection: "row",
                marginBottom: 8,
              }}
            >
              <Image
                source={{
                  uri: "https://images.pexels.com/photos/1116035/pexels-photo-1116035.jpeg?auto=compress",
                }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              />
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: textColor,
                  }}
                >
                  Rental item ready for your project
                </Text>
              </View>
            </View>
          ) : (
            items.map((it, index) => (
              <View key={it.id}>
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 8,
                  }}
                >
                  <Image
                    source={{
                      uri:
                        it.image_url ??
                        "https://images.pexels.com/photos/1116035/pexels-photo-1116035.jpeg?auto=compress",
                    }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: textColor,
                      }}
                    >
                      {it.titulo_cached ?? "Rental item"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: muted,
                      }}
                    >
                      {`${it.qty ?? 1} x $${Number(it.precio ?? 0).toFixed(
                        2
                      )} USD`}
                    </Text>
                  </View>
                </View>
                {index < items.length - 1 && <Divider />}
              </View>
            ))
          )}

          <Divider />

          <SummaryRow title="Fechas" subtitle="10–12 Oct 2025" />
          <Divider />

          <SummaryRow
            title="Number of items"
            subtitle={`${itemsCount} ${itemsCount === 1 ? "item" : "items"}`}
          />
          <Divider />

          <SummaryRow
            title="Total price"
            subtitle={`USD $${priceTotal.toFixed(2)}, taxes included`}
          />

          <Divider />

          <View style={{ paddingVertical: 6 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: textColor,
              }}
            >
              Free cancellation
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: muted,
                marginTop: 2,
              }}
            >
              If you cancel before October 5, you will receive a full refund.
            </Text>
          </View>

          <Divider />

          <View style={{ paddingVertical: 6 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: textColor,
              }}
            >
              Warranty policy
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: muted,
                marginTop: 2,
              }}
            >
              If the tenant files a complaint about the condition of the
              property at the time of delivery, extra charges may be applied.
            </Text>
          </View>
        </View>

        {/* Payment method card */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/payment-method",
              params: {
                cartId,
                userId,
                articleId,          // 👈 lo reenviamos
                paymentMethod: methodLabel,
                message,
              },
            })
          }
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.ring,
            backgroundColor: cardBg,
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: muted,
              }}
            >
              Payment method
            </Text>
            <Text
              style={{
                fontSize: 14,
                marginTop: 2,
                color: textColor,
              }}
            >
              {methodLabel}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.icon} />
        </Pressable>

        {/* Write to host card */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/WriteToHost", // 👈 coincide con write-to-host.tsx
              params: {
                cartId,
                userId,
                articleId,          // 👈 también lo reenviamos
                paymentMethod: methodLabel,
                message,
              },
            })
          }
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.ring,
            backgroundColor: cardBg,
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: muted,
              }}
            >
              Write to the host
            </Text>
            <Text
              style={{
                fontSize: 14,
                marginTop: 2,
                color: textColor,
              }}
            >
              {previewMessage}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.icon} />
        </Pressable>

        <View
          style={{
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              marginBottom: 12,
              color: textColor,
            }}
          >
            Price information
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 13, color: textColor }}>Subtotal</Text>
            <Text style={{ fontSize: 13, color: textColor }}>
              ${priceSubtotal.toFixed(2)} USD
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: textColor }}>Taxes</Text>
            <Text style={{ fontSize: 13, color: textColor }}>
              ${priceTaxes.toFixed(2)} USD
            </Text>
          </View>

          <Divider />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: textColor,
              }}
            >
              Total USD
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: textColor,
              }}
            >
              ${priceTotal.toFixed(2)} USD
            </Text>
          </View>

          <Pressable
            onPress={handleConfirm}
            disabled={confirming}
            style={{
              height: 48,
              borderRadius: 999,
              backgroundColor: "#000000",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 6,
              opacity: confirming ? 0.7 : 1,
            }}
          >
            {confirming ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#ffffff",
                }}
              >
                {methodLabel === "Efectivo"
                  ? "Confirmar y pagar en efectivo"
                  : methodLabel}
              </Text>
            )}
          </Pressable>

          <Text
            style={{
              fontSize: 10,
              textAlign: "center",
              color: muted,
            }}
          >
            By selecting this button, I accept the terms and conditions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
