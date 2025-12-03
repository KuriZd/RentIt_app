// app/host/[id].tsx
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
    Text,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/button";

type HostProfile = {
    id: string;
    email: string | null;
    telefono: string | null;
    descripcion: string | null;
    avatar_url: string | null;
    creado_en: string | null;
    actualizado_en: string | null;
    nombre: string | null;
    curp: string | null;
    genero: string | null;
    estado_civil: string | null;
    numero_medico: string | null;
    direccion: any | null;
    fecha_nacimiento: string | null;
};

type HostStats = {
    ratingAvg: number;
    ratingCount: number;
    totalArticulos: number;
};

type HostReview = {
    id: number;
    comentario: string | null;
    calificacion: number | null;
    creado_en: string | null;
    autor_nombre: string | null;
    autor_avatar: string | null;
};

function InfoRow(props: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
}) {
    return (
        <View className="flex-row items-center px-4 py-3 gap-x-3">
            <View className="h-9 w-9 rounded-xl items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                <Feather name={props.icon} size={18} color="#6b7280" />
            </View>
            <View className="flex-1">
                <Text className="text-[12px] text-zinc-500 dark:text-zinc-400">
                    {props.label}
                </Text>
                <Text className="text-sm text-zinc-900 dark:text-zinc-50">
                    {props.value}
                </Text>
            </View>
        </View>
    );
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
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

function timeAgo(dateIso: string | null): string {
    if (!dateIso) return "";
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) return "hoy";
    if (days < 7) return `hace ${days} día${days === 1 ? "" : "s"}`;
    const weeks = Math.floor(days / 7);
    return `hace ${weeks} semana${weeks === 1 ? "" : "s"}`;
}

export default function HostProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const isDark = scheme === "dark";

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
            accent: "#ec4899",
            gold: "#F59E0B",
        }),
        [isDark]
    );

    const [host, setHost] = useState<HostProfile | null>(null);
    const [stats, setStats] = useState<HostStats>({
        ratingAvg: 0,
        ratingCount: 0,
        totalArticulos: 0,
    });
    const [reviews, setReviews] = useState<HostReview[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHost = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);

            // 1. Perfil del anfitrión
            const { data: perfil, error: perfilErr } = await supabase
                .from("perfiles")
                .select(
                    [
                        "id",
                        "email",
                        "telefono",
                        "descripcion",
                        "avatar_url",
                        "creado_en",
                        "actualizado_en",
                        "nombre",
                        "curp",
                        "genero",
                        "estado_civil",
                        "numero_medico",
                        "direccion",
                        "fecha_nacimiento",
                    ].join(", ")
                )
                .eq("id", id) // uuid
                .maybeSingle<HostProfile>();

            if (perfilErr) throw perfilErr;

            if (!perfil) {
                Alert.alert(
                    "No encontrado",
                    "No se encontró la información del anfitrión."
                );
                setHost(null);
                setStats({ ratingAvg: 0, ratingCount: 0, totalArticulos: 0 });
                setReviews([]);
                return;
            }

            setHost(perfil);

            // 2. Cuántos artículos tiene este anfitrión
            const { data: articulos, error: artErr } = await supabase
                .from("articulos")
                .select("id", { count: "exact", head: true })
                .eq("id_propietario", id);

            if (artErr) throw artErr;

            const totalArticulos = (articulos as any)?.length ?? 0;

            // 3. Reseñas donde este usuario es el DESTINO
            const { data: resenasRaw, error: rErr } = await supabase
                .from("reseñas")
                .select(
                    `
          id,
          calificacion,
          comentario,
          creado_en,
          id_autor,
          id_usuario_destino
        `
                )
                .eq("id_usuario_destino", id)
                .order("creado_en", { ascending: false });

            if (rErr) throw rErr;

            const nums = (resenasRaw ?? [])
                .map((r: any) => Number(r.calificacion))
                .filter((n) => !isNaN(n));

            const ratingCount = nums.length;
            const ratingAvg = ratingCount
                ? nums.reduce((a, b) => a + b, 0) / ratingCount
                : 0;

            // 4. Perfiles de quienes reseñan (id_autor)
            const reviewerIds = Array.from(
                new Set(
                    (resenasRaw ?? [])
                        .map((r: any) => r.id_autor as string | null)
                        .filter(Boolean)
                )
            ) as string[];

            let reviewersMap = new Map<
                string,
                { nombre: string | null; avatar_url: string | null }
            >();

            if (reviewerIds.length > 0) {
                const { data: reviewers, error: revErr } = await supabase
                    .from("perfiles")
                    .select("id, nombre, avatar_url")
                    .in("id", reviewerIds);

                if (revErr) throw revErr;

                reviewersMap = new Map(
                    (reviewers ?? []).map((p: any) => [
                        p.id as string,
                        {
                            nombre: p.nombre ?? "Usuario",
                            avatar_url: p.avatar_url ?? null,
                        },
                    ])
                );
            }

            const formatted: HostReview[] = (resenasRaw ?? [])
                .slice(0, 5)
                .map((r: any) => {
                    const reviewer = reviewersMap.get(r.id_autor as string) ?? {
                        nombre: "Usuario",
                        avatar_url: null,
                    };
                    return {
                        id: r.id as number,
                        comentario: (r.comentario as string) ?? null,
                        calificacion: (r.calificacion as number) ?? null,
                        creado_en: (r.creado_en as string) ?? null,
                        autor_nombre: reviewer.nombre,
                        autor_avatar: reviewer.avatar_url,
                    };
                });

            setReviews(formatted);

            setStats({
                ratingAvg,
                ratingCount,
                totalArticulos,
            });
        } catch (e: any) {
            console.error(e);
            Alert.alert(
                "Error",
                e?.message ?? "No se pudo cargar la información del anfitrión."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadHost();
    }, [loadHost]);

    const hostingYears = useMemo(() => {
        if (!host?.creado_en) return null;
        const created = new Date(host.creado_en);
        if (Number.isNaN(created.getTime())) return null;
        const diffMs = Date.now() - created.getTime();
        const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
        return Math.max(years, 0);
    }, [host?.creado_en]);

    const memberSince = useMemo(() => {
        if (!host?.creado_en) return null;
        const year = new Date(host.creado_en).getFullYear();
        if (!year || Number.isNaN(year)) return null;
        return `Miembro desde ${year}`;
    }, [host?.creado_en]);

    return (
        <View
            className="flex-1"
            style={{
                paddingTop: insets.top,
                backgroundColor: COLORS.bg,
            }}
        >
            {/* Header */}
            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={() => router.back()}
                    className="h-9 w-9 rounded-full items-center justify-center"
                    style={{
                        backgroundColor: isDark ? "#18181b" : "#f4f4f5",
                    }}
                >
                    <Feather
                        name="arrow-left"
                        size={22}
                        color={COLORS.icon}
                    />
                </Pressable>

                <Text
                    className="flex-1 text-center text-base font-semibold"
                    style={{ color: COLORS.text }}
                >
                    Anfitrión
                </Text>
                <View className="w-9" />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text
                        className="mt-3 text-sm"
                        style={{ color: COLORS.subtext }}
                    >
                        Cargando anfitrión…
                    </Text>
                </View>
            ) : !host ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text
                        className="text-center text-sm"
                        style={{ color: COLORS.subtext }}
                    >
                        No se encontró la información del anfitrión.
                    </Text>
                    <View className="mt-4 w-40">
                        <Button
                            label="Reintentar"
                            variant="primary"
                            onPress={loadHost}
                        />
                    </View>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        paddingBottom: insets.bottom + 24,
                        paddingHorizontal: 16,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Card principal grande */}
                    <View className="pt-2">
                        <View
                            className="rounded-3xl px-5 py-5 flex-row items-center shadow-sm"
                            style={{
                                backgroundColor: isDark ? "#3b0764" : "#fee2e2",
                            }}
                        >
                            {/* Avatar */}
                            <View className="mr-4">
                                <View className="h-24 w-24 rounded-full overflow-hidden border-2 border-white/80 bg-pink-100 dark:bg-pink-800">
                                    {host.avatar_url ? (
                                        <Image
                                            source={{ uri: host.avatar_url }}
                                            className="h-full w-full"
                                        />
                                    ) : (
                                        <View className="flex-1 items-center justify-center">
                                            <Feather
                                                name="user"
                                                size={40}
                                                color={COLORS.text}
                                            />
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Nombre y stats */}
                            <View className="flex-1">
                                <Text
                                    className="text-2xl font-semibold"
                                    style={{ color: COLORS.text }}
                                >
                                    {host.nombre ?? "Anfitrión"}
                                </Text>
                                {memberSince ? (
                                    <Text
                                        className="mt-1 text-[12px]"
                                        style={{ color: COLORS.subtext }}
                                    >
                                        {memberSince}
                                    </Text>
                                ) : null}

                                <View className="mt-4 flex-row">
                                    <View className="mr-5">
                                        <Text
                                            className="text-base font-semibold"
                                            style={{ color: COLORS.text }}
                                        >
                                            {stats.ratingCount}
                                        </Text>
                                        <Text className="text-[11px] text-zinc-700 dark:text-zinc-200">
                                            Reseñas
                                        </Text>
                                    </View>

                                    <View className="mr-5">
                                        <View className="flex-row items-center gap-x-1">
                                            <Feather
                                                name="star"
                                                size={14}
                                                color={COLORS.gold}
                                            />
                                            <Text
                                                className="text-base font-semibold"
                                                style={{ color: COLORS.text }}
                                            >
                                                {stats.ratingCount
                                                    ? stats.ratingAvg.toFixed(2)
                                                    : "N/A"}
                                            </Text>
                                        </View>
                                        <Text className="text-[11px] text-zinc-700 dark:text-zinc-200">
                                            Calificación
                                        </Text>
                                    </View>

                                    <View>
                                        <Text
                                            className="text-base font-semibold"
                                            style={{ color: COLORS.text }}
                                        >
                                            {hostingYears ?? "—"}
                                        </Text>
                                        <Text className="text-[11px] text-zinc-700 dark:text-zinc-200">
                                            Años como anfitrión
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Badge */}
                            <View className="ml-2 items-end self-start">
                                <View className="h-10 w-10 rounded-full bg-rose-500 items-center justify-center">
                                    <Feather name="shield" size={22} color="#f9fafb" />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Info rápida */}
                    <View
                        className="mt-5 rounded-2xl border bg-white dark:bg-zinc-900/90"
                        style={{ borderColor: COLORS.border }}
                    >
                        <InfoRow
                            icon="phone"
                            label="Teléfono"
                            value={host.telefono || "No especificado"}
                        />
                        <View
                            className="h-px mx-4"
                            style={{ backgroundColor: COLORS.border }}
                        />
                        <InfoRow
                            icon="mail"
                            label="Correo electrónico"
                            value={host.email || "No especificado"}
                        />
                        <View
                            className="h-px mx-4"
                            style={{ backgroundColor: COLORS.border }}
                        />
                        <InfoRow
                            icon="user"
                            label="CURP"
                            value={host.curp || "No especificado"}
                        />
                        <View
                            className="h-px mx-4"
                            style={{ backgroundColor: COLORS.border }}
                        />
                        <InfoRow
                            icon="heart"
                            label="Estado civil"
                            value={host.estado_civil || "No especificado"}
                        />

                        <View className="px-4 pt-2 pb-4">
                            <Button
                                label="Ver más detalles"
                                variant="outline"
                                onPress={() => { }}
                            />
                        </View>
                    </View>

                    {/* Descripción */}
                    <View className="mt-6">
                        <Text
                            className="text-base font-semibold mb-2"
                            style={{ color: COLORS.text }}
                        >
                            Sobre {host.nombre?.split(" ")[0] ?? "el anfitrión"}
                        </Text>
                        <Text
                            className="text-sm leading-relaxed"
                            style={{ color: COLORS.subtext }}
                        >
                            {host.descripcion ||
                                "Hola, estaré encantado de recibirte. Este alojamiento es un espacio seguro, limpio y tranquilo. Si tienes alguna duda, puedes escribirme por el chat antes de reservar."}
                        </Text>
                    </View>

                    {/* Reseñas ligadas al id_usuario_destino */}
                    <View className="mt-8">
                        <Text
                            className="text-lg font-semibold mb-4"
                            style={{ color: COLORS.text }}
                        >
                            Reseñas de {host.nombre?.split(" ")[0] ?? "este anfitrión"}
                        </Text>

                        {reviews.length === 0 ? (
                            <View
                                className="rounded-2xl px-4 py-5 items-center"
                                style={{
                                    backgroundColor: isDark ? "#020617" : "#f9fafb",
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                }}
                            >
                                <Feather
                                    name="info"
                                    size={18}
                                    color={COLORS.iconMuted}
                                    style={{ marginBottom: 6 }}
                                />
                                <Text
                                    className="text-sm text-center"
                                    style={{ color: COLORS.subtext }}
                                >
                                    Aún no hay reseñas para este anfitrión.
                                </Text>
                                <Text
                                    className="text-xs text-center mt-1"
                                    style={{ color: COLORS.subtext }}
                                >
                                    Reserva con confianza y sé de las primeras personas en dejar
                                    tu opinión.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {reviews.map((r) => (
                                    <View
                                        key={r.id}
                                        className="mb-6 pb-4"
                                        style={{
                                            borderBottomWidth: 1,
                                            borderBottomColor: COLORS.border,
                                        }}
                                    >
                                        <View className="flex-row items-center mb-2">
                                            <Image
                                                source={{
                                                    uri:
                                                        r.autor_avatar ||
                                                        "https://i.pravatar.cc/80?img=55",
                                                }}
                                                className="w-10 h-10 rounded-full mr-3"
                                            />
                                            <View>
                                                <Text
                                                    className="text-sm font-semibold"
                                                    style={{ color: COLORS.text }}
                                                >
                                                    {r.autor_nombre ?? "Usuario"}
                                                </Text>
                                                <Text
                                                    className="text-[11px]"
                                                    style={{ color: COLORS.subtext }}
                                                >
                                                    {timeAgo(r.creado_en)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center mb-1">
                                            <Stars value={Number(r.calificacion ?? 0)} size={13} />
                                            {r.creado_en && (
                                                <Text
                                                    className="text-[11px] ml-2"
                                                    style={{ color: COLORS.subtext }}
                                                >
                                                    · {timeAgo(r.creado_en)}
                                                </Text>
                                            )}
                                        </View>

                                        <Text
                                            className="text-sm leading-relaxed"
                                            style={{ color: COLORS.text }}
                                        >
                                            {r.comentario || "Sin comentario escrito."}
                                        </Text>
                                    </View>
                                ))}

                                <View className="mt-2 mb-1">
                                    <Button
                                        label="Mostrar más reseñas"
                                        variant="outline"
                                        onPress={() => {
                                            // aquí luego puedes navegar a una pantalla con TODAS las reseñas
                                        }}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
