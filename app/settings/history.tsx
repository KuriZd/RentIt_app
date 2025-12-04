// app/settings/history.tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReservationRow = {
    id: number;
    id_usuario: string;
    id_articulo: number;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    total: number | null;
    estado_reservacion: string | null;
    articulos: { titulo: string | null; url_publica: string | null }[] | null;
};

type UiReservation = {
    id: number;
    titulo: string;
    imageUrl: string | null;
    statusLabel: string;
    statusColor: string;
    subtitle: string;
};

function formatShortDate(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const meses = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ];
    return `${d.getDate()} de ${meses[d.getMonth()]}`;
}

function buildStatus(r: ReservationRow): {
    label: string;
    color: string;
    subtitle: string;
} {
    const now = new Date();
    const inicio = r.fecha_inicio ? new Date(r.fecha_inicio) : null;
    const fin = r.fecha_fin ? new Date(r.fecha_fin) : null;
    const estado = (r.estado_reservacion || "").toLowerCase();
    const totalFmt =
        typeof r.total === "number"
            ? new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
            }).format(r.total)
            : "";

    if (estado.includes("reembolso") || estado.includes("reembolsado")) {
        return {
            label: "Reembolso emitido",
            color: "#0891b2",
            subtitle:
                "El reembolso puede tardar hasta 15 días hábiles en verse reflejado en tu cuenta.",
        };
    }

    if (estado.includes("cancel")) {
        return {
            label: "Reserva cancelada",
            color: "#b91c1c",
            subtitle: "Esta reserva fue cancelada. No se realizará ningún cargo.",
        };
    }

    if (inicio && inicio > now) {
        const diffMs = inicio.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            return {
                label: "Empieza mañana",
                color: "#16a34a",
                subtitle:
                    "Tu renta comenzará mañana. Asegúrate de coordinar la entrega.",
            };
        }
        return {
            label: `Empieza el ${formatShortDate(r.fecha_inicio)}`,
            color: "#16a34a",
            subtitle: "Tu renta está confirmada. Pronto podrás disfrutar el artículo.",
        };
    }

    if (fin && fin < now) {
        return {
            label: `Finalizada el ${formatShortDate(r.fecha_fin)}`,
            color: "#4b5563",
            subtitle:
                totalFmt !== ""
                    ? `Tu renta finalizó correctamente. Total pagado: ${totalFmt}.`
                    : "Tu renta finalizó correctamente.",
        };
    }

    if (inicio && inicio <= now && (!fin || fin >= now)) {
        return {
            label: "Renta en curso",
            color: "#2563eb",
            subtitle:
                "Tu renta está activa. Recuerda devolver el artículo a tiempo.",
        };
    }

    return {
        label: "Reserva",
        color: "#6b7280",
        subtitle:
            totalFmt !== ""
                ? `Estado: ${r.estado_reservacion || "desconocido"}. Total estimado: ${totalFmt}.`
                : `Estado: ${r.estado_reservacion || "desconocido"}.`,
    };
}

export default function RentalHistory() {
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
            bg: isDark ? "#020617" : "#f9fafb",
            card: isDark ? "#030712" : "#ffffff",
            text: isDark ? "#f9fafb" : "#0b1120",
            subtext: isDark ? "#9ca3af" : "#6b7280",
            border: isDark ? "#1f2937" : "#e5e7eb",
        }),
        [isDark]
    );

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<UiReservation[]>([]);

    const loadReservations = useCallback(async () => {
        try {
            setLoading(true);

            const { data: auth, error: authErr } = await supabase.auth.getUser();
            if (authErr || !auth?.user) {
                setItems([]);
                setLoading(false);
                return;
            }

            const userId = auth.user.id;

            const { data, error } = await supabase
                .from("reservaciones")
                .select(
                    `
          id,
          id_usuario,
          id_articulo,
          fecha_inicio,
          fecha_fin,
          total,
          estado_reservacion,
          articulos (
            titulo,
            url_publica
          )
        `
                )
                .eq("id_usuario", userId)
                .order("creado_en", { ascending: false });

            if (error) throw error;

            const rows = data as ReservationRow[];

            const ui: UiReservation[] = rows.map((r) => {
                const art = r.articulos && r.articulos.length > 0 ? r.articulos[0] : null;
                const titulo = art?.titulo || "Artículo rentado";
                const imageUrl =
                    art?.url_publica || "https://picsum.photos/seed/rentit-history/300/300";

                const status = buildStatus(r);

                return {
                    id: r.id,
                    titulo,
                    imageUrl,
                    statusLabel: status.label,
                    statusColor: status.color,
                    subtitle: status.subtitle,
                };
            });

            setItems(ui);
        } catch (e: any) {
            console.error(e);
            Alert.alert(
                "Error",
                e?.message || "No se pudo cargar el historial de rentas."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReservations();
    }, [loadReservations]);

    return (
        <View
            className="flex-1"
            style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View className="flex-row items-center px-4 pb-3">
                <Pressable
                    className="h-9 w-9 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: COLORS.pill }}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={20} color={COLORS.icon} />
                </Pressable>
                <Text
                    className="text-base font-semibold"
                    style={{ color: COLORS.text }}
                >
                    Historial de rentas
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text
                        className="mt-3 text-sm"
                        style={{ color: COLORS.subtext }}
                    >
                        Cargando tus rentas…
                    </Text>
                </View>
            ) : items.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text
                        className="text-sm text-center"
                        style={{ color: COLORS.subtext }}
                    >
                        Aún no tienes rentas registradas. Cuando rentes un artículo,
                        aparecerá aquí tu historial.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        paddingBottom: insets.bottom + 16,
                        paddingHorizontal: 16,
                        paddingTop: 4,
                    }}
                >
                    <View className="w-full max-w-xl self-center">
                        <Text
                            className="text-xs mb-2 ml-1"
                            style={{ color: COLORS.subtext }}
                        >
                            Últimos tres meses
                        </Text>

                        {items.map((r) => (
                            <Pressable
                                key={r.id}
                                className="flex-row items-center rounded-2xl mb-2"
                                style={{
                                    backgroundColor: COLORS.card,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    paddingHorizontal: 10,
                                    paddingVertical: 8,
                                }}
                                onPress={() =>
                                    router.push({
                                        pathname: "/settings/history-detail",
                                        params: { id: String(r.id) },
                                    })
                                }
                            >
                                <View className="mr-3 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                                    <Image
                                        source={{ uri: r.imageUrl || "" }}
                                        className="w-16 h-16"
                                        resizeMode="cover"
                                    />
                                </View>

                                <View className="flex-1">
                                    <Text
                                        className="text-[11px] font-semibold mb-0.5"
                                        style={{ color: r.statusColor }}
                                        numberOfLines={1}
                                    >
                                        {r.statusLabel}
                                    </Text>
                                    <Text
                                        className="text-[11px] mb-1"
                                        style={{ color: COLORS.subtext }}
                                        numberOfLines={2}
                                    >
                                        {r.subtitle}
                                    </Text>
                                    <Text
                                        className="text-sm font-medium"
                                        style={{ color: COLORS.text }}
                                        numberOfLines={1}
                                    >
                                        {r.titulo}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
