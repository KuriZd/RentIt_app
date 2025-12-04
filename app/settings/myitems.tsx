// app/settings/myitems.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    Pressable,
    Text,
    View,
    useColorScheme,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type UnidadPrecio = "hora" | "dia" | "semana";

type Articulo = {
    id: number;
    titulo: string;
    precio: number;
    unidad_precio: UnidadPrecio;
    periodo_cantidad: number | null;
    url_publica: string | null;
    estado_publicacion: string | null;
    estado_articulo: string | null;
};

export default function MyItemsScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const isDark = scheme === "dark";

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

    const bg = isDark ? "#0b0b0c" : "#f9fafb";

    const [items, setItems] = useState<Articulo[]>([]);
    const [loading, setLoading] = useState(true);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error(userError);
                setItems([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("articulos")
                .select(
                    "id, titulo, precio, unidad_precio, periodo_cantidad, url_publica, estado_publicacion, estado_articulo"
                )
                .eq("id_propietario", user.id)
                .eq("estado_publicacion", "publicado")
                .order("creado_en", { ascending: false });

            if (error) {
                console.error(error);
                setItems([]);
                setLoading(false);
                return;
            }

            setItems((data || []) as Articulo[]);
        } catch (e) {
            console.error(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const renderItem = ({ item }: { item: Articulo }) => (
        <View
            className="mb-3 flex-row rounded-2xl border bg-white dark:bg-zinc-900"
            style={{
                borderColor: isDark ? "#27272a" : "#e5e7eb",
                padding: 10,
                shadowOpacity: Platform.OS === "ios" ? 0.05 : 0,
                shadowRadius: Platform.OS === "ios" ? 6 : 0,
                shadowOffset: Platform.OS === "ios" ? { width: 0, height: 3 } : undefined,
            }}
        >
            {/* Thumbnail */}
            <View className="mr-3 h-20 w-20 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                {item.url_publica ? (
                    <Image
                        source={{ uri: item.url_publica }}
                        className="h-20 w-20"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="h-full w-full items-center justify-center">
                        <Feather name="image" size={18} color={COLORS.iconMuted} />
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
                <Text
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                    numberOfLines={2}
                >
                    {item.titulo}
                </Text>

                <View className="mt-1 flex-row items-baseline gap-1">
                    <Text className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        ${item.precio.toFixed(2)}
                    </Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        / {item.periodo_cantidad ?? 1} {item.unidad_precio}
                    </Text>
                </View>

                <View className="mt-2 flex-row items-center gap-2">
                    <View
                        className="rounded-full px-2 py-1"
                        style={{ backgroundColor: COLORS.pill }}
                    >
                        <Text className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200">
                            {item.estado_publicacion ?? "Publicado"}
                        </Text>
                    </View>
                    {item.estado_articulo && (
                        <Text className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            Estado: {item.estado_articulo}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );

    const hasItems = items.length > 0;

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: bg }}
            edges={["top", "bottom"]}
        >
            <View
                className="flex-1"
                style={{
                    paddingHorizontal: 20,
                    paddingBottom: 24 + Math.max(insets.bottom, 0),
                    paddingTop: 12 + Math.max(insets.top, 0),
                }}
            >
                {/* Header compacto */}
                <View className="mb-5 flex-row items-center gap-3">
                    <Pressable
                        onPress={() => router.back()}
                        className="h-9 w-9 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: isDark ? "#18181b" : "#e5e7eb",
                        }}
                    >
                        <Feather name="arrow-left" size={18} color={COLORS.icon} />
                    </Pressable>
                    <Text className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        Mis artículos en renta
                    </Text>
                </View>

                {loading && (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="small" />
                        <Text className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                            Cargando tus artículos...
                        </Text>
                    </View>
                )}

                {!loading && !hasItems && (
                    <View className="flex-1 items-center justify-center">
                        <Text className="mb-2 text-base font-medium text-zinc-800 dark:text-zinc-100">
                            Aún no tienes artículos publicados.
                        </Text>
                        <Text className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                            Publica un artículo desde la pantalla principal para verlo aquí.
                        </Text>
                    </View>
                )}

                {!loading && hasItems && (
                    <FlatList
                        data={items}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
