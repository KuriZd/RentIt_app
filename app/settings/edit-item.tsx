// app/settings/edit-item.tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useColorScheme
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type UnidadPrecio = "hora" | "dia" | "semana";
type EstadoArticulo = "nuevo" | "como_nuevo" | "bueno" | "aceptable";
type EstadoPublicacion = "borrador" | "publicado";

type ArticuloDb = {
    id: number;
    titulo: string;
    descripcion: string | null;
    precio: number;
    unidad_precio: UnidadPrecio;
    periodo_cantidad: number | null;
    estado_articulo: EstadoArticulo | null;
    estado_publicacion: EstadoPublicacion | null;
    cantidad_disponible: number | null;
};

export default function EditItemScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const articuloId = id ? Number(id) : null;

    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    const insets = useSafeAreaInsets();

    const COLORS = useMemo(
        () => ({
            bg: isDark ? "#0b0b0c" : "#f9fafb",
            card: isDark ? "#18181b" : "#ffffff",
            border: isDark ? "#27272a" : "#e5e7eb",
            text: isDark ? "#fafafa" : "#111827",
            sub: isDark ? "#a1a1aa" : "#6b7280",
            pill: isDark ? "#27272a" : "#f3f4f6",
            accent: "#2563eb",
        }),
        [isDark]
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // campos del formulario
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState(""); // precio total mostrado al usuario
    const [periodQty, setPeriodQty] = useState("1");
    const [unidad, setUnidad] = useState<UnidadPrecio>("dia");
    const [estadoArticulo, setEstadoArticulo] =
        useState<EstadoArticulo>("como_nuevo");
    const [estadoPublicacion, setEstadoPublicacion] =
        useState<EstadoPublicacion>("publicado");
    const [cantidadDisponible, setCantidadDisponible] = useState("1");
    const [descripcion, setDescripcion] = useState("");
    const [savedModalOpen, setSavedModalOpen] = useState(false);
    const [savedTitle, setSavedTitle] = useState<string | null>(null);


    useEffect(() => {
        if (!articuloId || Number.isNaN(articuloId)) {
            Alert.alert(
                "Artículo no encontrado",
                "No pudimos identificar el artículo a editar.",
                [{ text: "Volver", onPress: () => router.back() }]
            );
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from("articulos")
                    .select(
                        "id, titulo, descripcion, precio, unidad_precio, periodo_cantidad, estado_articulo, estado_publicacion, cantidad_disponible"
                    )
                    .eq("id", articuloId)
                    .maybeSingle();

                if (error || !data) {
                    Alert.alert(
                        "Error",
                        "No se pudo cargar la información del artículo.",
                        [{ text: "Volver", onPress: () => router.back() }]
                    );
                    return;
                }

                if (cancelled) return;

                const art = data as ArticuloDb;
                const qty = art.periodo_cantidad ?? 1;
                const totalPrice = art.precio * qty;

                setTitle(art.titulo ?? "");
                setDescripcion(art.descripcion ?? "");
                setUnidad(art.unidad_precio ?? "dia");
                setPeriodQty(String(qty));
                setPrice(totalPrice.toString());
                setEstadoArticulo(art.estado_articulo ?? "como_nuevo");
                setEstadoPublicacion(art.estado_publicacion ?? "publicado");
                setCantidadDisponible(
                    String(art.cantidad_disponible ?? 1)
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [articuloId, router]);

    const onlyInt = (s: string) => s.replace(/[^\d]/g, "");

    const onSave = async () => {
        if (!articuloId) return;

        const titleTrim = title.trim();
        if (!titleTrim) {
            Alert.alert("Título requerido", "Agrega un título para tu artículo.");
            return;
        }

        const priceNum = Number(price);
        if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
            Alert.alert(
                "Precio inválido",
                "Ingresa un precio total mayor a 0."
            );
            return;
        }

        const qty = Math.max(1, parseInt(onlyInt(periodQty || "1"), 10));
        const precioPorUnidad = +(priceNum / qty).toFixed(2);
        const cantNum = Number(onlyInt(cantidadDisponible || "1")) || 1;

        try {
            setSaving(true);

            const { error } = await supabase
                .from("articulos")
                .update({
                    titulo: titleTrim,
                    descripcion: descripcion.trim(),
                    precio: precioPorUnidad,
                    periodo_cantidad: qty,
                    unidad_precio: unidad,
                    estado_articulo: estadoArticulo,
                    estado_publicacion: estadoPublicacion,
                    cantidad_disponible: cantNum,
                })
                .eq("id", articuloId);

            if (error) {
                if (__DEV__) console.log("Error al actualizar artículo", error);
                Alert.alert(
                    "No se pudo guardar",
                    "Ocurrió un problema al actualizar el artículo. Inténtalo de nuevo."
                );
                return;
            }

            setSavedTitle(titleTrim);
            setSavedModalOpen(true);
        } catch (e) {
            if (__DEV__) console.log("Error al actualizar artículo", e);
            Alert.alert(
                "Error inesperado",
                "No se pudieron guardar los cambios. Inténtalo más tarde."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: COLORS.bg }}
            >
                <ActivityIndicator />
                <Text
                    className="mt-3 text-sm"
                    style={{ color: COLORS.sub }}
                >
                    Cargando artículo...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: COLORS.bg }}
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
                {/* Header */}
                <View className="mb-5 flex-row items-center gap-3">
                    <Pressable
                        onPress={() => router.back()}
                        className="h-9 w-9 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: isDark ? "#18181b" : "#e5e7eb",
                        }}
                    >
                        <Feather name="arrow-left" size={18} color={COLORS.text} />
                    </Pressable>
                    <Text
                        className="text-xl font-semibold"
                        style={{ color: COLORS.text }}
                    >
                        Editar artículo
                    </Text>
                </View>

                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Título */}
                    <Text
                        className="mb-2 text-sm font-medium"
                        style={{ color: COLORS.sub }}
                    >
                        Título
                    </Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ej. Motosierra Husqvarna 585XP"
                        placeholderTextColor={COLORS.sub}
                        className="mb-4 rounded-2xl px-4 py-3 text-base"
                        style={{
                            backgroundColor: COLORS.card,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            color: COLORS.text,
                        }}
                    />

                    {/* Precio total + periodo */}
                    <Text
                        className="mb-2 text-sm font-medium"
                        style={{ color: COLORS.sub }}
                    >
                        Precio total ingresado
                    </Text>
                    <View className="flex-row items-center gap-2 mb-3">
                        <TextInput
                            value={price}
                            onChangeText={setPrice}
                            placeholder="$ 900"
                            placeholderTextColor={COLORS.sub}
                            keyboardType="numeric"
                            className="flex-1 rounded-2xl px-4 py-3 text-base"
                            style={{
                                backgroundColor: COLORS.card,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                color: COLORS.text,
                            }}
                        />

                        <View style={{ minWidth: 90 }}>
                            <Text
                                className="mb-1 text-xs"
                                style={{ color: COLORS.sub }}
                            >
                                Cantidad
                            </Text>
                            <TextInput
                                value={periodQty}
                                onChangeText={(t) => setPeriodQty(onlyInt(t))}
                                placeholder="1"
                                placeholderTextColor={COLORS.sub}
                                keyboardType="number-pad"
                                className="rounded-2xl px-4 py-2 text-base text-center"
                                style={{
                                    backgroundColor: COLORS.card,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    color: COLORS.text,
                                }}
                            />
                        </View>
                    </View>

                    <Text
                        className="mb-1 text-xs"
                        style={{ color: COLORS.sub }}
                    >
                        Unidad de tiempo
                    </Text>
                    <View className="flex-row gap-2 mb-4">
                        {(["hora", "dia", "semana"] as UnidadPrecio[]).map((u) => {
                            const active = u === unidad;
                            return (
                                <Pressable
                                    key={u}
                                    onPress={() => setUnidad(u)}
                                    className="px-4 py-2 rounded-2xl border"
                                    style={{
                                        borderColor: active ? COLORS.accent : COLORS.border,
                                        backgroundColor: active ? COLORS.accent : "transparent",
                                    }}
                                >
                                    <Text
                                        className="text-sm font-medium"
                                        style={{
                                            color: active ? "#fff" : COLORS.text,
                                        }}
                                    >
                                        {u === "hora"
                                            ? "Hora"
                                            : u === "dia"
                                                ? "Día"
                                                : "Semana"}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Cantidad disponible */}
                    <Text
                        className="mb-2 text-sm font-medium"
                        style={{ color: COLORS.sub }}
                    >
                        Cantidad disponible
                    </Text>
                    <TextInput
                        value={cantidadDisponible}
                        onChangeText={(t) =>
                            setCantidadDisponible(onlyInt(t))
                        }
                        placeholder="1"
                        placeholderTextColor={COLORS.sub}
                        keyboardType="number-pad"
                        className="mb-4 rounded-2xl px-4 py-3 text-base"
                        style={{
                            backgroundColor: COLORS.card,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            color: COLORS.text,
                        }}
                    />

                    {/* Estado artículo */}
                    <Text
                        className="mb-2 text-sm font-medium"
                        style={{ color: COLORS.sub }}
                    >
                        Condición del artículo
                    </Text>
                    <View className="flex-row flex-wrap gap-2 mb-4">
                        {(
                            ["nuevo", "como_nuevo", "bueno", "aceptable"] as EstadoArticulo[]
                        ).map((e) => {
                            const active = e === estadoArticulo;
                            return (
                                <Pressable
                                    key={e}
                                    onPress={() => setEstadoArticulo(e)}
                                    className="px-4 py-2 rounded-2xl border"
                                    style={{
                                        backgroundColor: active
                                            ? COLORS.accent
                                            : "transparent",
                                        borderColor: active
                                            ? COLORS.accent
                                            : COLORS.border,
                                    }}
                                >
                                    <Text
                                        className="text-sm font-medium"
                                        style={{
                                            color: active ? "#fff" : COLORS.text,
                                        }}
                                    >
                                        {e.replace("_", " ")}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Estado publicación */}
                    <Text
                        className="mb-2 text-sm font-medium"
                        style={{ color: COLORS.sub }}
                    >
                        Estado de publicación
                    </Text>
                    <View className="flex-row gap-2 mb-4">
                        {(["borrador", "publicado"] as EstadoPublicacion[]).map((s) => {
                            const active = s === estadoPublicacion;
                            return (
                                <Pressable
                                    key={s}
                                    onPress={() => setEstadoPublicacion(s)}
                                    className="px-4 py-2 rounded-2xl border"
                                    style={{
                                        backgroundColor: active
                                            ? COLORS.accent
                                            : "transparent",
                                        borderColor: active
                                            ? COLORS.accent
                                            : COLORS.border,
                                    }}
                                >
                                    <Text
                                        className="text-sm font-medium"
                                        style={{
                                            color: active ? "#fff" : COLORS.text,
                                        }}
                                    >
                                        {s === "borrador" ? "Borrador" : "Publicado"}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Descripción */}
                    <Text
                        className="mb-2 text-sm font-medium"
                        style={{ color: COLORS.sub }}
                    >
                        Descripción
                    </Text>
                    <TextInput
                        value={descripcion}
                        onChangeText={setDescripcion}
                        placeholder="Detalles, estado, condiciones y políticas de renta…"
                        placeholderTextColor={COLORS.sub}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        className="mb-6 rounded-2xl px-4 py-3 text-base"
                        style={{
                            backgroundColor: COLORS.card,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            color: COLORS.text,
                        }}
                    />

                    {/* Botón guardar */}
                    <Pressable
                        onPress={onSave}
                        disabled={saving}
                        className="mt-2 rounded-2xl py-3 items-center"
                        style={{
                            backgroundColor: saving ? "#4b5563" : COLORS.accent,
                            opacity: saving ? 0.8 : 1,
                        }}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-base font-semibold text-white">
                                Guardar cambios
                            </Text>
                        )}
                    </Pressable>
                </ScrollView>
            </View>

            {savedModalOpen && (
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
                        backgroundColor: "rgba(0,0,0,0.45)",
                        paddingHorizontal: 24,
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
                        {/* Header del modal */}
                        <View className="mb-3 flex-row items-center">
                            <View
                                className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                                style={{
                                    backgroundColor: isDark ? "#022c22" : "#dcfce7",
                                }}
                            >
                                <Feather name="check-circle" size={22} color="#22c55e" />
                            </View>
                            <Text
                                className="text-base font-semibold"
                                style={{ color: COLORS.text }}
                            >
                                Cambios guardados
                            </Text>
                        </View>

                        {/* Texto */}
                        <Text
                            className="text-sm mb-4"
                            style={{ color: COLORS.sub }}
                        >
                            Tu artículo{" "}
                            {savedTitle ? (
                                <Text
                                    className="font-semibold"
                                    style={{ color: COLORS.text }}
                                >
                                    “{savedTitle}”
                                </Text>
                            ) : null}{" "}
                            se actualizó correctamente.
                        </Text>

                        {/* Botones */}
                        <View className="flex-row justify-end gap-3">
                            <Pressable
                                onPress={() => setSavedModalOpen(false)}
                                className="px-4 py-2 rounded-xl"
                                style={{
                                    backgroundColor: isDark ? "#27272a" : "#e5e7eb",
                                }}
                            >
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: COLORS.text }}
                                >
                                    Seguir editando
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    setSavedModalOpen(false);
                                    router.replace("/settings/myitems");
                                }}
                                className="px-4 py-2 rounded-xl flex-row items-center"
                                style={{
                                    backgroundColor: "#22c55e",
                                }}
                            >
                                <Feather
                                    name="arrow-right"
                                    size={16}
                                    color="#fff"
                                    style={{ marginRight: 6 }}
                                />
                                <Text className="text-sm font-semibold text-white">
                                    Volver a mis artículos
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
