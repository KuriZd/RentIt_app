// app/settings/history-seller-review.tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReservationRow = {
    id: number;
    id_usuario: string;
    id_articulo: number | null;
    articulos:
    | {
        id: number;
        titulo: string | null;
        url_publica: string | null;
        id_propietario: string | null;
    }[]
    | null;
};

type UiReservation = {
    id: number;
    articuloId: number | null;
    propietarioId: string | null;
    titulo: string;
    imageUrl: string | null;
};

export default function HistorySellerReview() {
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
            starOn: "#facc15",
            starOff: isDark ? "#4b5563" : "#e5e7eb",
            cta: "#facc15",
            ctaText: "#111827",
        }),
        [isDark]
    );

    const [loading, setLoading] = useState(true);
    const [reservation, setReservation] = useState<UiReservation | null>(null);

    const [rating, setRating] = useState(0);
    const [sellerMatch, setSellerMatch] = useState<"si" | "no" | null>(null);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
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

                const { data, error } = await supabase
                    .from("reservaciones")
                    .select(
                        `
            id,
            id_usuario,
            id_articulo,
            articulos (
              id,
              titulo,
              url_publica,
              id_propietario
            )
          `
                    )
                    .eq("id", Number(id))
                    .eq("id_usuario", userId)
                    .maybeSingle();

                if (error) throw error;
                if (!data) {
                    setReservation(null);
                    return;
                }

                const r = data as ReservationRow;
                const art =
                    r.articulos && r.articulos.length > 0 ? r.articulos[0] : null;

                const articuloId = r.id_articulo ?? art?.id ?? null;
                const propietarioId = art?.id_propietario ?? null;
                const titulo = art?.titulo || "Artículo rentado";
                const imageUrl =
                    art?.url_publica ||
                    "https://picsum.photos/seed/rentit-seller/300/300";

                setReservation({
                    id: r.id,
                    articuloId,
                    propietarioId,
                    titulo,
                    imageUrl,
                });
            } catch (e: any) {
                console.error(e);
                Alert.alert(
                    "Error",
                    e?.message || "No se pudo cargar la información del artículo."
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleSubmit = async () => {
        if (!reservation) return;
        if (!rating || !sellerMatch) {
            Alert.alert(
                "Faltan datos",
                "Agrega una calificación y responde si el artículo coincidía con la descripción."
            );
            return;
        }

        try {
            setSubmitting(true);

            const { data: auth, error: authErr } = await supabase.auth.getUser();
            if (authErr || !auth?.user) {
                Alert.alert(
                    "Sesión requerida",
                    "Inicia sesión para evaluar al vendedor."
                );
                return;
            }

            const comentarioBase =
                `[Coincidencia con la descripción: ${sellerMatch === "si" ? "Sí" : "No"
                }]\n\n` + (comment.trim() || "");

            const { error } = await supabase.from("reseñas").insert({
                id_reservacion: reservation.id,
                id_autor: auth.user.id,
                id_articulo: reservation.articuloId,
                id_usuario_destino: reservation.propietarioId,
                calificacion: rating,
                comentario: comentarioBase || null,
            });

            if (error) throw error;

            Alert.alert(
                "Evaluación enviada",
                "Gracias por evaluar al vendedor.",
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (e: any) {
            console.error(e);
            Alert.alert(
                "Error",
                e?.message || "No se pudo guardar tu evaluación."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => (
        <View className="flex-row mt-2 mb-3">
            {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                    key={value}
                    onPress={() => setRating(value)}
                    className="mr-1"
                >
                    <Feather
                        name="star"
                        size={26}
                        color={value <= rating ? COLORS.starOn : COLORS.starOff}
                    />
                </Pressable>
            ))}
        </View>
    );

    const renderRadio = (value: "si" | "no", label: string) => {
        const selected = sellerMatch === value;
        return (
            <Pressable
                onPress={() => setSellerMatch(value)}
                className="flex-row items-center mr-6"
            >
                <View
                    style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: selected ? COLORS.cta : COLORS.ring,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 6,
                    }}
                >
                    {selected && (
                        <View
                            style={{
                                width: 9,
                                height: 9,
                                borderRadius: 999,
                                backgroundColor: COLORS.cta,
                            }}
                        />
                    )}
                </View>
                <Text style={{ color: COLORS.text, fontSize: 13 }}>{label}</Text>
            </Pressable>
        );
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
                    Evaluar al vendedor
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
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
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900 mr-3">
                                <Image
                                    source={{ uri: reservation.imageUrl || "" }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </View>
                            <Text
                                className="flex-1 text-sm font-semibold"
                                style={{ color: COLORS.text }}
                                numberOfLines={2}
                            >
                                {reservation.titulo}
                            </Text>
                        </View>

                        <Text
                            className="text-sm font-semibold"
                            style={{ color: COLORS.text }}
                        >
                            Evaluar al vendedor
                        </Text>
                        {renderStars()}

                        <Text
                            className="mt-2 mb-1 text-sm"
                            style={{ color: COLORS.text }}
                        >
                            ¿El artículo se correspondía con la descripción del vendedor?
                        </Text>

                        <View className="flex-row mb-3 mt-1">
                            {renderRadio("si", "Sí")}
                            {renderRadio("no", "No")}
                        </View>

                        <Text
                            className="mt-2 mb-1 text-sm"
                            style={{ color: COLORS.text }}
                        >
                            Comentarios
                        </Text>
                        <TextInput
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            placeholder="Escribe aquí los comentarios acerca de tu experiencia con este vendedor."
                            placeholderTextColor={COLORS.subtext}
                            value={comment}
                            onChangeText={setComment}
                            style={{
                                borderWidth: 1,
                                borderColor: COLORS.ring,
                                backgroundColor: COLORS.card,
                                color: COLORS.text,
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                fontSize: 13,
                                marginBottom: 14,
                            }}
                        />

                        <Text
                            className="text-xs mb-4"
                            style={{ color: COLORS.subtext }}
                        >
                            El nombre asociado a tu cuenta se mostrará con tus comentarios.
                        </Text>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting}
                            className="rounded-full items-center justify-center"
                            style={{
                                opacity: submitting ? 0.7 : 1,
                                backgroundColor: COLORS.cta,
                                paddingVertical: 12,
                            }}
                        >
                            <Text
                                className="text-sm font-semibold"
                                style={{ color: COLORS.ctaText }}
                            >
                                {submitting ? "Enviando..." : "Enviar evaluación"}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
