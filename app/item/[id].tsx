import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/button";

type UnidadPrecio = "hora" | "dia" | "semana";

type Articulo = {
  id: number;
  titulo: string;
  descripcion: string | null;
  precio: number;
  unidad_precio: UnidadPrecio;
  periodo_cantidad: number | null;
  url_publica: string | null;
  id_propietario: string | null;
  estado_articulo: string | null;
  estado_publicacion: string | null;
  solo_retiro: boolean | null;
  entrega_disponible: boolean | null;
  tarifa_entrega: number | null;
};

type ReviewAgg = { avg: number; count: number };

type CartStatus = "active" | "pending" | "completed" | "cancelled";
type DeliveryMethod = "Envio" | "Pickup" | "Entrega";

const { width: W } = Dimensions.get("window");

const unitLabel = {
  hora: { sing: "hora", plural: "horas" },
  dia: { sing: "día", plural: "días" },
  semana: { sing: "semana", plural: "semanas" },
} as const;

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }, (_, i) => {
        const state =
          i < full ? "full" : i === full && hasHalf ? "half" : "empty";
        return (
          <Feather
            key={i}
            name="star"
            size={size}
            color={state === "empty" ? "#D4D4D8" : "#F59E0B"}
            style={{
              marginRight: i < 4 ? 2 : 0,
              opacity: state === "half" ? 0.6 : 1,
            }}
          />
        );
      })}
    </View>
  );
}

const getOrCreateCartId = async (perfilId: string): Promise<string> => {
  const { data: existing, error: existingErr } = await supabase
    .from("carts")
    .select("id")
    .eq("id_perfil", perfilId)
    .eq("status", "active" as CartStatus)
    .maybeSingle<{ id: string }>();

  if (existingErr) throw existingErr;
  if (existing?.id) return existing.id;

  const { data: inserted, error: insertErr } = await supabase
    .from("carts")
    .insert({ id_perfil: perfilId, status: "active" as CartStatus })
    .select("id")
    .single<{ id: string }>();

  if (insertErr) throw insertErr;
  return inserted.id;
};

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const insets = useSafeAreaInsets();

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
      bg: isDark ? "#0b0b0c" : "#ffffff",
      text: isDark ? "#fafafa" : "#111827",
      subtext: isDark ? "#a1a1aa" : "#6b7280",
      border: isDark ? "#3f3f46" : "#e5e7eb",
      card: isDark ? "#18181b" : "#ffffff",
      accent: "#2563eb",
      gold: "#F59E0B",
    }),
    [isDark]
  );

  const [item, setItem] = useState<Articulo | null>(null);
  const [rating, setRating] = useState<ReviewAgg>({ avg: 0, count: 0 });
  const [owner, setOwner] = useState<{ nombre: string; avatar?: string | null }>(
    {
      nombre: "Usuario",
      avatar: null,
    }
  );
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);

      const { data: art, error: artErr } = await supabase
        .from("articulos")
        .select(
          [
            "id",
            "titulo",
            "descripcion",
            "precio",
            "unidad_precio",
            "periodo_cantidad",
            "url_publica",
            "id_propietario",
            "estado_articulo",
            "estado_publicacion",
            "solo_retiro",
            "entrega_disponible",
            "tarifa_entrega",
          ].join(", ")
        )
        .eq("id", Number(id))
        .maybeSingle<Articulo>();

      if (artErr) throw artErr;
      if (!art) {
        Alert.alert(
          "No encontrado",
          "El artículo no existe o fue eliminado."
        );
        return;
      }

      setItem(art);

      if (art.id_propietario) {
        const { data: perfil, error: perfilErr } = await supabase
          .from("perfiles")
          .select("nombre, avatar_url")
          .eq("id", art.id_propietario)
          .maybeSingle();

        if (perfilErr) throw perfilErr;

        setOwner({
          nombre: (perfil as any)?.nombre ?? "Usuario",
          avatar: (perfil as any)?.avatar_url ?? null,
        });
      }

      const { data: reseñas, error: rErr } = await supabase
        .from("reseñas")
        .select("calificacion")
        .eq("id_articulo", Number(id));

      if (rErr) throw rErr;

      const nums = (reseñas ?? [])
        .map((r: any) => Number(r.calificacion))
        .filter((n) => !isNaN(n));
      const avg = nums.length
        ? nums.reduce((a, b) => a + b, 0) / nums.length
        : 0;
      setRating({ avg, count: nums.length });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo cargar el artículo.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const priceLine = useMemo(() => {
    if (!item) return "";
    const qty = Math.max(1, item.periodo_cantidad ?? 1);
    const u = unitLabel[item.unidad_precio] ?? unitLabel["dia"];
    const unit = qty === 1 ? u.sing : u.plural;
    const money = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(item.precio);
    return `${money} por ${qty} ${unit}`;
  }, [item]);

  const hero = item?.url_publica || `https://picsum.photos/seed/${id}/1200/900`;

  const estadoArticuloColor =
    item?.estado_articulo === "disponible"
      ? "#10b981"
      : item?.estado_articulo === "mantenimiento"
      ? "#f59e0b"
      : "#ef4444";

  const estadoPublicacionColor =
    item?.estado_publicacion === "publicado"
      ? "#2563eb"
      : item?.estado_publicacion === "pausado"
      ? "#f59e0b"
      : "#9ca3af";

  const handleReserve = async () => {
    if (!item) return;

    try {
      setAddingToCart(true);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        Alert.alert(
          "Inicia sesión",
          "Necesitas iniciar sesión para agregar al carrito.",
          [{ text: "Ir a login", onPress: () => router.push("/auth/login") }]
        );
        return;
      }

      const perfilId = authData.user.id;

      const cartId = await getOrCreateCartId(perfilId);

      const periodo_cantidad = Math.max(1, item.periodo_cantidad ?? 1);

      const metodo: DeliveryMethod = item.solo_retiro
        ? "Pickup"
        : item.entrega_disponible
        ? "Envio"
        : "Entrega";

      const { error: insertErr } = await supabase.from("cart_items").insert({
        id_carrito: cartId,
        id_articulo: item.id,
        titulo_cached: item.titulo,
        image_url: item.url_publica,
        precio: item.precio,
        unidad: item.unidad_precio,
        periodo_cantidad,
        qty: 1,
        metodo,
        tarifa_entrega: item.tarifa_entrega ?? 0,
        solo_retiro: item.solo_retiro ?? false,
        entrega_disponible: item.entrega_disponible ?? false,
        disponible: true,
      });

      if (insertErr) throw insertErr;

      Alert.alert("Añadido al carrito", "El artículo se agregó a tu carrito.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo agregar al carrito.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 130,
          paddingHorizontal: 16,
        }}
      >
        <View className="mt-2 rounded-3xl overflow-hidden">
          <Image
            source={{ uri: hero }}
            style={{ width: W - 32, height: 240 }}
            resizeMode="cover"
          />
        </View>

        <View className="w-full mt-4">
          <View
            className="rounded-3xl px-5 pb-6 pt-5 shadow-sm"
            style={{
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              className="text-center text-xl font-semibold"
              style={{ color: COLORS.text }}
              numberOfLines={2}
            >
              {item?.titulo ?? ""}
            </Text>

            <View className="mt-3 flex-row justify-center gap-2">
              {item?.estado_articulo && (
                <View
                  className="px-3 py-1 rounded-full border"
                  style={{
                    borderColor: estadoArticuloColor,
                    backgroundColor: estadoArticuloColor + "22",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: estadoArticuloColor }}
                  >
                    {item.estado_articulo}
                  </Text>
                </View>
              )}

              {item?.estado_publicacion && (
                <View
                  className="px-3 py-1 rounded-full border"
                  style={{
                    borderColor: estadoPublicacionColor,
                    backgroundColor: estadoPublicacionColor + "22",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: estadoPublicacionColor }}
                  >
                    {item.estado_publicacion}
                  </Text>
                </View>
              )}
            </View>

            {item?.descripcion ? (
              <Text
                className="mt-3 text-center leading-5"
                style={{ color: COLORS.subtext }}
                numberOfLines={3}
              >
                {item.descripcion}
              </Text>
            ) : null}

            <View className="flex-row items-center justify-between mt-5">
              <View className="items-center">
                <Text
                  className="text-lg font-semibold"
                  style={{ color: COLORS.text }}
                >
                  {rating.count ? rating.avg.toFixed(2) : "—"}
                </Text>
                <Stars value={rating.avg} />
              </View>

              <View className="items-center">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: isDark ? "#312e81" : "#fef3c7" }}
                >
                  <Feather name="award" size={24} color={COLORS.gold} />
                </View>
                <Text
                  className="text-xs mt-1"
                  style={{ color: COLORS.subtext }}
                >
                  Top rated
                </Text>
              </View>

              <View className="items-center">
                <Text
                  className="text-lg font-semibold"
                  style={{ color: COLORS.text }}
                >
                  {rating.count}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.subtext }}>
                  Reviews
                </Text>
              </View>
            </View>

            <View
              className="my-5 h-px"
              style={{ backgroundColor: COLORS.border }}
            />

            <View className="flex-row items-center">
              <Image
                source={{
                  uri: owner.avatar || "https://i.pravatar.cc/80?img=12",
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text
                  className="text-sm font-medium"
                  style={{ color: COLORS.text }}
                >
                  {owner.nombre}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.subtext }}>
                  Propietario verificado
                </Text>
              </View>
            </View>

            <View
              className="my-5 h-px"
              style={{ backgroundColor: COLORS.border }}
            />

            <View className="gap-3">
              <View className="flex-row items-start">
                <Text className="mr-2">🏆</Text>
                <Text style={{ color: COLORS.subtext }}>
                  En el top 1% de artículos mejor calificados.
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="mr-2">🌟</Text>
                <Text style={{ color: COLORS.subtext }}>
                  Este artículo suele estar reservado con frecuencia.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {rating.count > 0 ? (
          <View className="px-1 mt-6">
            <View
              className="rounded-3xl px-6 py-7"
              style={{
                backgroundColor: isDark ? "#020617" : "#f9fafb",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <View className="items-center mb-3">
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 26, marginRight: 8 }}>🏅</Text>
                  <Text
                    style={{
                      fontSize: 40,
                      fontWeight: "700",
                      color: COLORS.text,
                    }}
                  >
                    {rating.avg.toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: 26, marginLeft: 8 }}>🏅</Text>
                </View>

                <Text
                  className="mt-2 text-base font-semibold"
                  style={{ color: COLORS.text }}
                >
                  Favorito entre huéspedes
                </Text>

                <Text
                  className="mt-2 text-xs text-center leading-4"
                  style={{ color: COLORS.subtext }}
                >
                  Este alojamiento está en el 5% de los mejor calificados entre
                  los anuncios que cumplen con los requisitos, con base en las
                  calificaciones, las evaluaciones y la confiabilidad.
                </Text>
              </View>

              <View
                className="w-full mt-4 pt-4"
                style={{
                  borderTopColor: COLORS.border,
                  borderTopWidth: 1,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <Stars value={rating.avg} size={13} />
                  <Text
                    className="text-[11px] ml-2"
                    style={{ color: COLORS.subtext }}
                  >
                    Hace 1 mes
                  </Text>
                </View>

                <Text
                  className="text-sm mb-3"
                  style={{ color: COLORS.text }}
                >
                  Muy buen lugar, tranquilo, agradable y atención
                  personalizada.
                </Text>

                <View className="flex-row items-center">
                  <Image
                    source={{
                      uri: "https://i.pravatar.cc/80?img=32",
                    }}
                    className="w-9 h-9 rounded-full mr-2"
                  />
                  <View>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: COLORS.text }}
                    >
                      Juan Esteban
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: COLORS.subtext }}
                    >
                      Puebla, México
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                className="mt-5 w-full rounded-2xl py-3 items-center justify-center"
                style={{
                  backgroundColor: isDark ? "#18181b" : "#f3f4f6",
                }}
                onPress={() => {}}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: COLORS.text }}
                >
                  {`Mostrar las ${rating.count} evaluaciones`}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="px-1 mt-6">
            <View
              className="rounded-3xl px-6 py-6 items-center"
              style={{
                backgroundColor: isDark ? "#020617" : "#f9fafb",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Feather
                name="info"
                size={20}
                color={COLORS.iconMuted}
                style={{ marginBottom: 8 }}
              />
              <Text
                className="text-sm text-center"
                style={{ color: COLORS.subtext }}
              >
                Aún no hay reseñas para este artículo.
              </Text>
              <Text
                className="text-xs text-center mt-1"
                style={{ color: COLORS.subtext }}
              >
                Reserva y sé la primera persona en dejar tu opinión.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="absolute left-0 right-0"
        style={{
          bottom: insets.bottom ? insets.bottom - 4 : 0,
        }}
      >
        <View
          className="px-4 pt-3 pb-4"
          style={{
            backgroundColor: COLORS.bg,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm" style={{ color: COLORS.text }}>
                {priceLine || " "}
              </Text>
              <View className="flex-row items-center mt-1">
                <Feather name="check-circle" color="#22c55e" size={14} />
                <Text
                  className="text-xs ml-1"
                  style={{ color: COLORS.subtext }}
                >
                  Cancelación gratuita
                </Text>
              </View>
            </View>

            <View className="w-36">
              <Button
                label={addingToCart ? "Agregando..." : "Reservar"}
                variant="primary"
                disabled={addingToCart || !item}
                onPress={handleReserve}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
