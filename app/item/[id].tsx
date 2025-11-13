// app/items/[id].tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Button from "../../components/ui/button";

/* ----------------- Tipos ----------------- */
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
  estado_articulo: string | null;     // ← enum en DB
  estado_publicacion: string | null;  // ← enum en DB
};
type ReviewAgg = { avg: number; count: number };
type OwnerProfile = {
  nombre?: string | null;
  full_name?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

const { width: W } = Dimensions.get("window");
const unitLabel = {
  hora: { sing: "hour", plural: "hours" },
  dia: { sing: "day", plural: "days" },
  semana: { sing: "week", plural: "weeks" },
} as const;

/* ----------------- Stars ----------------- */
function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }, (_, i) => {
        const state = i < full ? "full" : i === full && hasHalf ? "half" : "empty";
        return (
          <Feather
            key={i}
            name="star"
            size={size}
            color={state === "empty" ? "#D4D4D8" : "#F59E0B"}
            style={{ marginRight: i < 4 ? 2 : 0, opacity: state === "half" ? 0.6 : 1 }}
          />
        );
      })}
    </View>
  );
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Paleta base (tu instrucción global + extras)
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

      // chips
      chipBg: isDark ? "#1f2937" : "#f3f4f6",
      chipText: isDark ? "#e5e7eb" : "#111827",
      chipBorder: isDark ? "#374151" : "#e5e7eb",
    }),
    [isDark]
  );

  const [item, setItem] = useState<Articulo | null>(null);
  const [rating, setRating] = useState<ReviewAgg>({ avg: 0, count: 0 });
  const [owner, setOwner] = useState<{ displayName: string; avatar?: string | null }>({
    displayName: "",
    avatar: null,
  });
  const [loading, setLoading] = useState(true);

  const pickDisplayName = (p?: OwnerProfile | null): string => {
    if (!p) return "";
    if (p.nombre?.trim()) return p.nombre!;
    if (p.full_name?.trim()) return p.full_name!;
    if (p.username?.trim()) return p.username!;
    const fn = p.first_name?.trim() ?? "";
    const ln = p.last_name?.trim() ?? "";
    const combo = [fn, ln].filter(Boolean).join(" ");
    return combo || "Usuario";
  };

  // Mapeo de estilos para los estados
  const statusStyles = useMemo(() => {
    // Ajusta keys a tus enums exactos si difieren
    const bg = (hex: string) => (isDark ? hex + "20" : hex + "18"); // leve transparencia
    return {
      articulo: {
        disponible: { label: "Available",   bg: bg("#10b981"), border: "#10b981", text: "#065f46" },
        mantenimiento: { label: "Maintenance", bg: bg("#f59e0b"), border: "#f59e0b", text: "#92400e" },
        ocupado: { label: "In use",       bg: bg("#ef4444"), border: "#ef4444", text: "#7f1d1d" },
        // fallback
        default: { label: "Unknown",      bg: COLORS.chipBg, border: COLORS.chipBorder, text: COLORS.chipText },
      },
      publicacion: {
        publicado: { label: "Published",  bg: bg("#3b82f6"), border: "#3b82f6", text: "#1e40af" },
        pausado:   { label: "Paused",     bg: bg("#f59e0b"), border: "#f59e0b", text: "#92400e" },
        borrador:  { label: "Draft",      bg: bg("#9ca3af"), border: "#9ca3af", text: "#374151" },
        default:   { label: "Unknown",    bg: COLORS.chipBg, border: COLORS.chipBorder, text: COLORS.chipText },
      },
    };
  }, [COLORS, isDark]);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);

      // Artículo (incluye estados)
      const { data: art, error: artErr } = await supabase
        .from("articulos")
        .select(
          "id, titulo, descripcion, precio, unidad_precio, periodo_cantidad, url_publica, id_propietario, estado_articulo, estado_publicacion"
        )
        .eq("id", Number(id))
        .maybeSingle();
      if (artErr) throw artErr;
      if (!art) {
        Alert.alert("Not found", "Este artículo no existe o fue removido.");
        setItem(null);
        return;
      }
      const article = art as Articulo;
      setItem(article);

      // Propietario
      if (article.id_propietario) {
        const { data: prof, error: profErr } = await supabase
          .from("perfiles")
          .select("nombre, avatar_url")
          .eq("id", article.id_propietario)
          .maybeSingle();
        if (profErr) throw profErr;

        setOwner({
          displayName: pickDisplayName(prof as OwnerProfile),
          avatar: (prof as OwnerProfile)?.avatar_url ?? null,
        });
      } else {
        setOwner({ displayName: "Usuario", avatar: null });
      }

      // Reseñas
      const { data: rows, error: rErr } = await supabase
        .from("reseñas")
        .select("calificacion")
        .eq("id_articulo", Number(id));
      if (rErr) throw rErr;

      const nums = (rows ?? []).map((r: any) => Number(r.calificacion)).filter((n) => !isNaN(n));
      const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      setRating({ avg, count: nums.length });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo cargar la información.");
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
    const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
      item.precio
    );
    return `${money} for ${qty} ${unit}`;
  }, [item]);

  const hero = item?.url_publica || `https://picsum.photos/seed/${id}/1200/900`;

  // Helpers para pintar chips
  const chipForArticulo = (() => {
    const key = (item?.estado_articulo || "").toLowerCase();
    const map = statusStyles.articulo as any;
    return map[key] ?? map.default;
  })();

  const chipForPublicacion = (() => {
    const key = (item?.estado_publicacion || "").toLowerCase();
    const map = statusStyles.publicacion as any;
    return map[key] ?? map.default;
  })();

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View>
          <Image source={{ uri: hero }} style={{ width: W, height: 240 }} />
       
        </View>

        {/* CARD */}
        <View className="px-4 -mt-8">
          <View
            className="rounded-3xl px-5 pb-6 pt-5 shadow-sm"
            style={{ backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}
          >
            {/* Título */}
            <Text className="text-center text-xl font-semibold" style={{ color: COLORS.text }} numberOfLines={2}>
              {item?.titulo ?? " "}
            </Text>

            {/* Chips de estado */}
            <View className="mt-3 flex-row items-center justify-center">
              <View
                className="px-3 py-1 rounded-full border mr-2"
                style={{ backgroundColor: chipForArticulo.bg, borderColor: chipForArticulo.border }}
              >
                <Text className="text-xs font-medium" style={{ color: chipForArticulo.text }}>
                  {chipForArticulo.label}
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full border"
                style={{ backgroundColor: chipForPublicacion.bg, borderColor: chipForPublicacion.border }}
              >
                <Text className="text-xs font-medium" style={{ color: chipForPublicacion.text }}>
                  {chipForPublicacion.label}
                </Text>
              </View>
            </View>

            {/* Descripción breve */}
            {item?.descripcion ? (
              <Text className="mt-3 text-center leading-5" style={{ color: COLORS.subtext }} numberOfLines={3}>
                {item.descripcion}
              </Text>
            ) : null}

            {/* Métricas */}
            <View className="flex-row items-center justify-between mt-5">
              <View className="items-center">
                <Text className="text-lg font-semibold" style={{ color: COLORS.text }}>
                  {rating.count ? rating.avg.toFixed(2) : "—"}
                </Text>
                <Stars value={rating.avg} />
              </View>

              <View className="items-center">
                <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? "#312e81" : "#fef3c7" }}>
                  <Feather name="award" size={24} color={COLORS.gold} />
                </View>
                <Text className="text-xs mt-1" style={{ color: COLORS.subtext }}>
                  Top rated
                </Text>
              </View>

              <View className="items-center">
                <Text className="text-lg font-semibold" style={{ color: COLORS.text }}>
                  {rating.count}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.subtext }}>
                  Reviews
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="my-5 h-px" style={{ backgroundColor: COLORS.border }} />

            {/* Propietario */}
            <View className="flex-row items-center">
              <Image
                source={{ uri: owner.avatar || "https://i.pravatar.cc/80?img=12" }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="text-sm font-medium" style={{ color: COLORS.text }}>
                  {owner.displayName || "Usuario"}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.subtext }}>
                  some of our best · 3 years of experience
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="my-5 h-px" style={{ backgroundColor: COLORS.border }} />

            {/* Highlights */}
            <View className="gap-3">
              <View className="flex-row items-start">
                <Text className="mr-2">🏆</Text>
                <Text style={{ color: COLORS.subtext }}>
                  In the top 1% of highest-rated tools. Multiple rentals without complaints.
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="mr-2">🌟</Text>
                <Text style={{ color: COLORS.subtext }}>
                  A unique opportunity, this article is usually reserved.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* CTA inferior */}
      <View
        className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-4"
        style={{ backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-sm" style={{ color: COLORS.text }}>
              {priceLine || " "}
            </Text>
            <View className="flex-row items-center mt-1">
              <Feather name="check-circle" color="#22c55e" size={14} />
              <Text className="text-xs ml-1" style={{ color: COLORS.subtext }}>
                Free cancellation
              </Text>
            </View>
          </View>

          <View className="w-36">
            <Button
              label="Reserve"
              variant="primary"
              onPress={() => Alert.alert("Reserved", "We’ll notify the owner 🚀")}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
