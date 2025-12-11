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

type ToastState =
    | {
        type: "success" | "error";
        title: string;
        message?: string;
    }
    | null;

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
            overlay: "rgba(0,0,0,0.35)",
            card: isDark ? "#18181b" : "#ffffff",
        }),
        [isDark]
    );

    const bg = isDark ? "#0b0b0c" : "#f9fafb";

    const [items, setItems] = useState<Articulo[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [toast, setToast] = useState<ToastState>(null);

    // Artículo seleccionado para confirmar eliminación
    const [confirmItem, setConfirmItem] = useState<Articulo | null>(null);

    const showToast = useCallback((t: ToastState, duration = 2500) => {
        if (!t) return;
        setToast(t);
        setTimeout(() => {
            setToast(null);
        }, duration);
    }, []);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                if (__DEV__) console.log(userError);
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
                if (__DEV__) console.log(error);
                setItems([]);
                setLoading(false);
                return;
            }

            setItems((data || []) as Articulo[]);
        } catch (e) {
            if (__DEV__) console.log(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const performDelete = useCallback(
        async (item: Articulo) => {
            try {
                setDeletingId(item.id);

                const { error } = await supabase
                    .from("articulos")
                    .delete()
                    .eq("id", item.id);

                if (error) {
                    if (__DEV__) console.log("Error al eliminar artículo:", error);
                    showToast({
                        type: "error",
                        title: "No se pudo eliminar",
                        message: "Ocurrió un problema al eliminar el artículo.",
                    });
                    return;
                }

                setItems((prev) => prev.filter((it) => it.id !== item.id));

                showToast({
                    type: "success",
                    title: "Artículo eliminado",
                    message: "Tu artículo se eliminó correctamente.",
                });
            } catch (e) {
                if (__DEV__) console.log("Error al eliminar artículo:", e);
                showToast({
                    type: "error",
                    title: "No se pudo eliminar",
                    message: "Ocurrió un problema al eliminar el artículo.",
                });
            } finally {
                setDeletingId(null);
                setConfirmItem(null);
            }
        },
        [showToast]
    );

        const handleEdit = (item: Articulo) => {
        router.push({
            pathname: "/settings/edit-item",
            params: { id: String(item.id) },
        });
    };


    const renderItem = ({ item }: { item: Articulo }) => (
        <View
            className="mb-3 flex-row rounded-2xl border bg-white dark:bg-zinc-900"
            style={{
                borderColor: isDark ? "#27272a" : "#e5e7eb",
                padding: 10,
                shadowOpacity: Platform.OS === "ios" ? 0.05 : 0,
                shadowRadius: Platform.OS === "ios" ? 6 : 0,
                shadowOffset:
                    Platform.OS === "ios" ? { width: 0, height: 3 } : undefined,
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

            {/* Info + botón eliminar */}
            <View style={{ flex: 1, flexDirection: "row" }}>
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

                {/* Botones Editar / Eliminar */}
                <View
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                    }}
                >
                    {/* Editar */}
                    <Pressable
                        onPress={() => handleEdit(item)}
                        className="mb-2 h-8 w-8 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: isDark ? "#111827" : "#e5e7eb",
                        }}
                    >
                        <Feather name="edit-2" size={16} color={COLORS.icon} />
                    </Pressable>

                    {/* Eliminar */}
                    <Pressable
                        onPress={() => setConfirmItem(item)}
                        disabled={deletingId === item.id}
                        className="h-8 w-8 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: isDark ? "#18181b" : "#fee2e2",
                            opacity: deletingId === item.id ? 0.6 : 1,
                        }}
                    >
                        {deletingId === item.id ? (
                            <ActivityIndicator size="small" />
                        ) : (
                            <Feather name="trash-2" size={16} color="#dc2626" />
                        )}
                    </Pressable>
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

            {/* Toast flotante */}
            {toast && (
                <View
                    pointerEvents="box-none"
                    style={{
                        position: "absolute",
                        top: Platform.OS === "ios" ? 60 : 40,
                        left: 16,
                        right: 16,
                        zIndex: 999,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 18,
                            backgroundColor:
                                toast.type === "success" ? "#16a34a" : "#dc2626",
                            shadowColor: "#000",
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 10,
                        }}
                    >
                        <Feather
                            name={
                                toast.type === "success" ? "check-circle" : "alert-triangle"
                            }
                            size={18}
                            color="#fff"
                            style={{ marginTop: 2, marginRight: 8 }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    color: "#fff",
                                    fontSize: 14,
                                    fontWeight: "600",
                                }}
                            >
                                {toast.title}
                            </Text>
                            {toast.message ? (
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontSize: 12,
                                        marginTop: 4,
                                        opacity: 0.9,
                                    }}
                                >
                                    {toast.message}
                                </Text>
                            ) : null}
                        </View>
                        <Pressable onPress={() => setToast(null)}>
                            <Feather name="x" size={16} color="#fff" />
                        </Pressable>
                    </View>
                </View>
            )}

            {/* 🔥 Modal de confirmación estilizado */}
            {confirmItem && (
                <View
                    pointerEvents="box-none"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: COLORS.overlay,
                        paddingHorizontal: 24,
                        zIndex: 1000,
                    }}
                >
                    <View
                        className="w-full rounded-2xl p-5"
                        style={{
                            backgroundColor: COLORS.card,
                            shadowColor: "#000",
                            shadowOpacity: 0.25,
                            shadowRadius: 20,
                            shadowOffset: { width: 0, height: 10 },
                            elevation: 12,
                        }}
                    >
                        <View className="mb-3 flex-row items-center">
                            <View
                                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                                style={{
                                    backgroundColor: isDark ? "#450a0a" : "#fee2e2",
                                }}
                            >
                                <Feather name="trash-2" size={20} color="#dc2626" />
                            </View>
                            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                                Eliminar artículo
                            </Text>
                        </View>

                        <Text className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                            ¿Seguro que quieres eliminar{" "}
                            <Text className="font-semibold">
                                “{confirmItem.titulo}”
                            </Text>
                            ? Esta acción no se puede deshacer.
                        </Text>

                        <View className="flex-row justify-end gap-3 mt-2">
                            <Pressable
                                onPress={() => setConfirmItem(null)}
                                className="px-4 py-2 rounded-xl"
                                style={{
                                    backgroundColor: isDark ? "#27272a" : "#e5e7eb",
                                }}
                            >
                                <Text className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                    Cancelar
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => performDelete(confirmItem)}
                                className="px-4 py-2 rounded-xl flex-row items-center"
                                style={{
                                    backgroundColor: "#dc2626",
                                    opacity:
                                        deletingId === confirmItem.id ? 0.7 : 1,
                                }}
                                disabled={deletingId === confirmItem.id}
                            >
                                {deletingId === confirmItem.id && (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                        style={{ marginRight: 6 }}
                                    />
                                )}
                                <Text className="text-sm font-semibold text-white">
                                    Eliminar
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
