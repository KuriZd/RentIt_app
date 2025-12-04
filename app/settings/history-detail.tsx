// app/settings/history-detail.tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Share,
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
};

type ArticleRow = {
    id: number;
    titulo: string | null;
    url_publica: string | null;
    id_propietario: string | null;
};

type UiReservationDetail = {
    id: number;
    titulo: string;
    imageUrl: string | null;
    statusLabel: string;
    statusSubtitle: string;
    statusColor: string;
    deliveryLabel: string;
    extraInfo: string;
    ownerId: string | null;
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

function buildStatus(
    r: ReservationRow
): {
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

// room_id determinista entre 2 usuarios
function buildRoomId(a: string, b: string) {
    return [a, b].sort().join(":");
}

export default function ReservationDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
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
            accent: "#2563eb",
            success: "#22c55e",
        }),
        [isDark]
    );

    const [loading, setLoading] = useState(true);
    const [reservation, setReservation] = useState<UiReservationDetail | null>(
        null
    );

    const loadReservation = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);

            const { data: auth, error: authErr } = await supabase.auth.getUser();
            if (authErr || !auth?.user) {
                setReservation(null);
                setLoading(false);
                return;
            }

            const userId = auth.user.id;

            // 1) Reservación
            const { data: resData, error: resErr } = await supabase
                .from("reservaciones")
                .select(
                    `
          id,
          id_usuario,
          id_articulo,
          fecha_inicio,
          fecha_fin,
          total,
          estado_reservacion
        `
                )
                .eq("id", Number(id))
                .eq("id_usuario", userId)
                .maybeSingle();

            if (resErr) throw resErr;
            if (!resData) {
                setReservation(null);
                return;
            }

            const r = resData as ReservationRow;

            // 2) Artículo
            const { data: artData, error: artErr } = await supabase
                .from("articulos")
                .select(
                    `
          id,
          titulo,
          url_publica,
          id_propietario
        `
                )
                .eq("id", r.id_articulo)
                .maybeSingle();

            if (artErr) throw artErr;

            const art = artData as ArticleRow | null;

            const titulo = art?.titulo || "Artículo rentado";
            const imageUrl =
                art?.url_publica || "https://picsum.photos/seed/rentit-history/300/300";
            const ownerId = art?.id_propietario ?? null;

            const status = buildStatus(r);

            const totalFmt =
                typeof r.total === "number"
                    ? new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                    }).format(r.total)
                    : "";

            const deliveryLabel =
                r.fecha_fin && new Date(r.fecha_fin) < new Date()
                    ? `Entregado el ${formatShortDate(r.fecha_fin)}`
                    : status.label;

            const extraParts: string[] = [];
            if (r.fecha_inicio)
                extraParts.push(`Inicio: ${formatShortDate(r.fecha_inicio)}`);
            if (r.fecha_fin)
                extraParts.push(`Fin: ${formatShortDate(r.fecha_fin)}`);
            if (totalFmt) extraParts.push(`Total: ${totalFmt}`);
            const extraInfo = extraParts.join(" · ");

            setReservation({
                id: r.id,
                titulo,
                imageUrl,
                statusLabel: status.label,
                statusSubtitle: status.subtitle,
                statusColor: status.color,
                deliveryLabel,
                extraInfo,
                ownerId,
            });
        } catch (e: any) {
            console.error(e);
            Alert.alert(
                "Error",
                e?.message || "No se pudo cargar la información de la renta."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadReservation();
    }, [loadReservation]);

    const handleShare = () => {
        if (!reservation) return;
        Share.share({
            message: `Checa este artículo que renté en RentIt: ${reservation.titulo}`,
        }).catch(() => { });
    };

    const goToProductReview = () => {
        if (!reservation) return;
        router.push({
            pathname: "/settings/history-review",
            params: { id: String(reservation.id) },
        });
    };

    const goToSellerReview = () => {
        if (!reservation) return;
        router.push({
            pathname: "/settings/history-seller-review",
            params: { id: String(reservation.id) },
        });
    };

    const handleMessageOwner = async () => {
        if (!reservation?.ownerId) {
            Alert.alert(
                "No disponible",
                "No se encontró el propietario de este artículo."
            );
            return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            Alert.alert(
                "Inicia sesión",
                "Debes iniciar sesión para enviar mensajes."
            );
            return;
        }

        const myId = data.user.id;
        const roomId = buildRoomId(myId, reservation.ownerId);

        router.push({
            pathname: "/messages/[id]",
            params: { id: roomId },
        });
    };

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
                    Detalle de renta
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="mt-3 text-sm" style={{ color: COLORS.subtext }}>
                        Cargando información…
                    </Text>
                </View>
            ) : !reservation ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text
                        className="text-sm text-center"
                        style={{ color: COLORS.subtext }}
                    >
                        No se encontró la información de esta renta.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: insets.bottom + 16,
                    }}
                >
                    <View className="w-full max-w-xl self-center">
                        {/* Tarjeta principal */}
                        <View
                            className="rounded-2xl mb-4 overflow-hidden"
                            style={{
                                backgroundColor: COLORS.card,
                                borderWidth: 1,
                                borderColor: COLORS.ring,
                            }}
                        >
                            <View className="flex-row p-3">
                                <View className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mr-3">
                                    <Image
                                        source={{ uri: reservation.imageUrl || "" }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                                <View className="flex-1 justify-between">
                                    <Text
                                        className="text-sm font-semibold mb-2"
                                        style={{ color: COLORS.text }}
                                        numberOfLines={3}
                                    >
                                        {reservation.titulo}
                                    </Text>
                                    <Pressable
                                        className="flex-row items-center"
                                        onPress={handleShare}
                                    >
                                        <Feather
                                            name="share-2"
                                            size={14}
                                            color={COLORS.accent}
                                        />
                                        <Text
                                            className="ml-1 text-xs font-medium"
                                            style={{ color: COLORS.accent }}
                                        >
                                            Compartir este artículo
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: COLORS.ring,
                                    marginHorizontal: 12,
                                }}
                            />

                            <Pressable className="flex-row items-center justify-between px-4 py-3">
                                <Text className="text-sm" style={{ color: COLORS.text }}>
                                    Comprar nuevamente
                                </Text>
                                <Feather
                                    name="chevron-right"
                                    size={18}
                                    color={COLORS.iconMuted}
                                />
                            </Pressable>

                            <Pressable
                                className="flex-row items-center justify-between px-4 py-3"
                                style={{
                                    borderTopWidth: 1,
                                    borderTopColor: COLORS.ring,
                                }}
                                onPress={handleMessageOwner}
                            >
                                <Text className="text-sm" style={{ color: COLORS.text }}>
                                    Enviar mensaje al propietario
                                </Text>
                                <Feather
                                    name="message-circle"
                                    size={18}
                                    color={COLORS.iconMuted}
                                />
                            </Pressable>
                        </View>

                        {/* Estado de la renta */}
                        <View
                            className="rounded-2xl p-3 mb-5"
                            style={{
                                backgroundColor: COLORS.card,
                                borderWidth: 1,
                                borderColor: COLORS.ring,
                            }}
                        >
                            <View className="flex-row">
                                <View className="mr-3 mt-1">
                                    <View
                                        className="h-6 w-6 rounded-full items-center justify-center"
                                        style={{ backgroundColor: COLORS.success }}
                                    >
                                        <Feather name="check" size={14} color="#ecfdf5" />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text
                                        className="text-sm font-semibold mb-1"
                                        style={{ color: COLORS.text }}
                                    >
                                        {reservation.deliveryLabel}
                                    </Text>
                                    <Text className="text-xs" style={{ color: COLORS.subtext }}>
                                        {reservation.statusSubtitle}
                                    </Text>
                                    {reservation.extraInfo ? (
                                        <Text
                                            className="text-xs mt-2"
                                            style={{ color: COLORS.subtext }}
                                        >
                                            {reservation.extraInfo}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        {/* Opiniones */}
                        <View
                            className="rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: COLORS.card,
                                borderWidth: 1,
                                borderColor: COLORS.ring,
                            }}
                        >
                            <Text
                                className="px-4 pt-3 pb-1 text-sm font-semibold"
                                style={{ color: COLORS.text }}
                            >
                                ¿Cómo está tu artículo?
                            </Text>

                            <Pressable
                                className="flex-row items-center justify-between px-4 py-3"
                                onPress={goToProductReview}
                            >
                                <Text className="text-sm" style={{ color: COLORS.text }}>
                                    Escribir una opinión sobre el producto
                                </Text>
                                <Feather
                                    name="chevron-right"
                                    size={18}
                                    color={COLORS.iconMuted}
                                />
                            </Pressable>

                            <Pressable
                                className="flex-row items-center justify-between px-4 py-3"
                                style={{
                                    borderTopWidth: 1,
                                    borderTopColor: COLORS.ring,
                                }}
                            >
                                <Text className="text-sm" style={{ color: COLORS.text }}>
                                    Crea una reseña en video
                                </Text>
                                <Feather
                                    name="chevron-right"
                                    size={18}
                                    color={COLORS.iconMuted}
                                />
                            </Pressable>

                            <Pressable
                                className="flex-row items-center justify-between px-4 py-3"
                                style={{
                                    borderTopWidth: 1,
                                    borderTopColor: COLORS.ring,
                                }}
                                onPress={goToSellerReview}
                            >
                                <Text className="text-sm" style={{ color: COLORS.text }}>
                                    Evaluar al vendedor
                                </Text>
                                <Feather
                                    name="chevron-right"
                                    size={18}
                                    color={COLORS.iconMuted}
                                />
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
