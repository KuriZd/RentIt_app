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
    id_articulo: number;
    articulos: { titulo: string | null; url_publica: string | null }[] | null;
};

type UiReservation = {
    id: number;
    titulo: string;
    imageUrl: string | null;
};

export default function HistoryProductReview() {
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
    const [opinion, setOpinion] = useState("");
    const [title, setTitle] = useState("");

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
            titulo,
            url_publica
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
                const art = r.articulos && r.articulos.length > 0 ? r.articulos[0] : null;
                const titulo = art?.titulo || "Artículo rentado";
                const imageUrl =
                    art?.url_publica || "https://picsum.photos/seed/rentit-review/300/300";

                setReservation({
                    id: r.id,
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

    const handleSubmit = () => {
        if (!rating || !title.trim()) {
            Alert.alert(
                "Faltan datos",
                "Agrega una calificación y un título para tu opinión."
            );
            return;
        }
        Alert.alert("Opinión enviada", "Gracias por compartir tu experiencia.");
        router.back();
    };

    const renderStars = () => {
        return (
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
                    Escribir opinión
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
                            ¿Qué tal estuvo el producto?
                        </Text>
                        {renderStars()}

                        <Text
                            className="mt-2 mb-1 text-sm"
                            style={{ color: COLORS.text }}
                        >
                            Escribe una opinión
                        </Text>
                        <TextInput
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            placeholder="¿Qué deben saber otros clientes?"
                            placeholderTextColor={COLORS.subtext}
                            value={opinion}
                            onChangeText={setOpinion}
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
                            className="mb-2 text-sm"
                            style={{ color: COLORS.text }}
                        >
                            Compartir un video o una foto
                        </Text>
                        <Pressable
                            className="items-center justify-center rounded-xl mb-4"
                            style={{
                                borderWidth: 1,
                                borderStyle: "dashed",
                                borderColor: COLORS.ring,
                                backgroundColor: isDark ? "#020617" : "#f3f4ff",
                                paddingVertical: 16,
                            }}
                        >
                            <Feather
                                name="video"
                                size={20}
                                color={COLORS.iconMuted}
                            />
                            <Text
                                className="mt-2 text-xs text-center px-6"
                                style={{ color: COLORS.subtext }}
                            >
                                Tu video podría ser el primero. Imagina que otros usuarios ven tu experiencia.
                            </Text>
                        </Pressable>

                        <Text
                            className="mb-1 text-sm"
                            style={{ color: COLORS.text }}
                        >
                            Titula tu opinión (requerido)
                        </Text>
                        <TextInput
                            placeholder="¿Qué es lo más importante para compartir?"
                            placeholderTextColor={COLORS.subtext}
                            value={title}
                            onChangeText={setTitle}
                            style={{
                                borderWidth: 1,
                                borderColor: COLORS.ring,
                                backgroundColor: COLORS.card,
                                color: COLORS.text,
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                fontSize: 13,
                                marginBottom: 20,
                            }}
                        />

                        <Pressable
                            onPress={handleSubmit}
                            className="rounded-full items-center justify-center"
                            style={{
                                backgroundColor: COLORS.cta,
                                paddingVertical: 12,
                            }}
                        >
                            <Text
                                className="text-sm font-semibold"
                                style={{ color: COLORS.ctaText }}
                            >
                                Enviar
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
