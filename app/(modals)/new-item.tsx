import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import Button from "../../components/ui/button";
import { supabase } from "../../utils/supabase";
import CategoriesSheet, { Category } from "./categories";

type Period = "hour" | "day" | "week";
type Currency = "USD" | "MXN" | "EUR";
type UnidadPrecio = "hora" | "dia" | "semana";
type EstadoArticulo = "nuevo" | "como_nuevo" | "bueno" | "aceptable";
type EstadoPublicacion = "borrador" | "publicado";
type DeliveryMode = "retiro" | "entrega";

type LocalAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export type NewItemPayload = {
  title: string;
  price: number;
  period: Period;
  currency: Currency;
  category: Category | null;
  description: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPublish?: (payload: NewItemPayload) => Promise<void> | void;
};

const mapPeriodToUnidad = (p: Period): UnidadPrecio =>
  p === "hour" ? "hora" : p === "day" ? "dia" : "semana";

type ToastState =
  | {
      type: "success" | "error";
      title: string;
      message?: string;
    }
  | null;

export default function NewItemSheet({ visible, onClose, onPublish }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const COLORS = useMemo(
    () => ({
      sheetBg: isDark ? "#0b0b0c" : "#ffffff",
      pill: isDark ? "#27272a" : "#f3f4f6",
      text: isDark ? "#fafafa" : "#111827",
      subtext: isDark ? "#a1a1aa" : "#52525b",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
      border: isDark ? "#3f3f46" : "#e5e7eb",
      card: isDark ? "#18181b" : "#ffffff",
      dashed: isDark ? "#3f3f46" : "#d4d4d8",
      accent: "#2563eb",
    }),
    [isDark]
  );

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [period, setPeriod] = useState<Period>("day");
  const [periodQty, setPeriodQty] = useState<string>("1");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [category, setCategory] = useState<Category | null>(null);
  const [desc, setDesc] = useState("");

  const [estadoArticulo, setEstadoArticulo] =
    useState<EstadoArticulo>("como_nuevo");
  const [estadoPublicacion, setEstadoPublicacion] =
    useState<EstadoPublicacion>("publicado");
  const [valorReposicion, setValorReposicion] = useState<string>("");
  const [depositoSeguridad, setDepositoSeguridad] = useState<string>("");
  const [duracionMinHoras, setDuracionMinHoras] = useState<string>("");
  const [duracionMaxDias, setDuracionMaxDias] = useState<string>("");
  const [cantidadDisponible, setCantidadDisponible] = useState<string>("1");

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("retiro");
  const [showDeliveryMenu, setShowDeliveryMenu] = useState(false);
  const [tarifaEntrega, setTarifaEntrega] = useState<string>("");

  const [longitud, setLongitud] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const [images, setImages] = useState<LocalAsset[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  // 🔒 Evitar submit doble
  const submittingRef = useRef(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Concede permiso para acceder a tus fotos."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 6,
    });
    if (result.canceled) return;
    const picked =
      result.assets?.map((a) => ({
        uri: a.uri,
        mimeType: (a as any).mimeType ?? null,
        fileName: (a as any).fileName ?? null,
      })) ?? [];
    setImages((prev) => [...prev, ...picked].slice(0, 10));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadToSupabase = async (userId: string) => {
    const uploads = await Promise.all(
      images.map(async (img, i) => {
        const res: any = await fetch(img.uri);
        const ab: ArrayBuffer =
          typeof res.arrayBuffer === "function"
            ? await res.arrayBuffer()
            : await res.blob().then((b: any) => b.arrayBuffer());
        const bytes = new Uint8Array(ab);
        const guessFromUri = () => {
          const q = img.uri.split("?")[0];
          const ext = (q.split(".").pop() || "").toLowerCase();
          if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
          if (ext === "png") return "image/png";
          if (ext === "webp") return "image/webp";
          return "application/octet-stream";
        };
        const contentType =
          img.mimeType && img.mimeType !== "" ? img.mimeType : guessFromUri();
        const ext = (contentType.split("/")[1] || "jpg").toLowerCase();
        const base =
          img.fileName?.replace(/\s+/g, "_").replace(/[^\w\.-]/g, "") ||
          `photo_${i}.${ext}`;
        const filename = base.includes(".") ? base : `${base}.${ext}`;
        const path = `${userId}/${Date.now()}_${i}_${filename}`;
        const { error } = await supabase.storage
          .from("items")
          .upload(path, bytes, {
            contentType,
            cacheControl: "3600",
            upsert: false,
          });
        if (error)
          throw new Error(`Error subiendo ${filename}: ${error.message}`);
        const { data } = supabase.storage.from("items").getPublicUrl(path);
        return { url: data.publicUrl as string, contentType, filename };
      })
    );
    return uploads;
  };

  const num = (s: string) => {
    if (!s.trim()) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const onlyInt = (s: string) => s.replace(/[^\d]/g, "");

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setPeriod("day");
    setPeriodQty("1");
    setCurrency("USD");
    setCategory(null);
    setDesc("");
    setEstadoArticulo("como_nuevo");
    setEstadoPublicacion("publicado");
    setValorReposicion("");
    setDepositoSeguridad("");
    setDuracionMinHoras("");
    setDuracionMaxDias("");
    setCantidadDisponible("1");
    setDeliveryMode("retiro");
    setTarifaEntrega("");
    setLongitud("");
    setImages([]);
  };

  const submit = async () => {
    if (loading || submittingRef.current) return;

    if (!title.trim()) {
      setToast({
        type: "error",
        title: "Falta título",
        message: "Agrega un título para tu artículo.",
      });
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setToast({
        type: "error",
        title: "Precio inválido",
        message: "Ingresa un número mayor a 0.",
      });
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const qty = Math.max(1, parseInt(onlyInt(periodQty || "1"), 10));
    if (
      deliveryMode === "entrega" &&
      (!tarifaEntrega || Number(tarifaEntrega) < 0)
    ) {
      setToast({
        type: "error",
        title: "Tarifa de entrega",
        message: "Agrega una tarifa válida.",
      });
      setTimeout(() => setToast(null), 2500);
      return;
    }

    try {
      setLoading(true);
      submittingRef.current = true;

      const { data: authData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !authData.user) throw new Error("No hay sesión activa.");
      const userId = authData.user.id;

      const uploads = images.length ? await uploadToSupabase(userId) : [];
      const firstImageUrl = uploads[0]?.url ?? null;

      const unidad = mapPeriodToUnidad(period);
      const precioPorUnidad = +(priceNum / qty).toFixed(2);
      const idCategoria =
        category && !isNaN(parseInt(category.key, 10))
          ? parseInt(category.key, 10)
          : null;

      const { data: inserted, error: insertErr } = await supabase
        .from("articulos")
        .insert({
          id_propietario: userId,
          id_categoria: idCategoria,
          titulo: title.trim(),
          descripcion: desc.trim(),
          precio: precioPorUnidad,
          unidad_precio: unidad,
          periodo_cantidad: qty,
          valor_reposicion: num(valorReposicion),
          deposito_seguridad: num(depositoSeguridad),
          duracion_min_horas: num(duracionMinHoras),
          duracion_max_dias: num(duracionMaxDias),
          cantidad_disponible: num(cantidadDisponible) ?? 1,
          solo_retiro: deliveryMode === "retiro",
          entrega_disponible: deliveryMode === "entrega",
          tarifa_entrega:
            deliveryMode === "entrega" ? num(tarifaEntrega) : null,
          estado_articulo: estadoArticulo,
          estado_publicacion: estadoPublicacion,
          publicado_en:
            estadoPublicacion === "publicado" ? new Date().toISOString() : null,
          longitud: num(longitud),
          url_publica: firstImageUrl,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      if (!inserted?.id) throw new Error("No se obtuvo el id del artículo.");

      const articuloId: number =
        typeof inserted.id === "string"
          ? parseInt(inserted.id, 10)
          : inserted.id;

      for (const u of uploads) {
        const nombre_archivo = (() => {
          try {
            return new URL(u.url).pathname.split("/").pop() || u.filename;
          } catch {
            return u.url.split("/").pop() || u.filename;
          }
        })();
        const { error: mErr } = await supabase.from("multimedia").insert({
          id_modelo: articuloId,
          tipo_modelo: "articulo",
          nombre_archivo,
          tipo_mime: u.contentType,
        });
        if (mErr) throw mErr;
      }

      if (onPublish) {
        await onPublish({
          title: title.trim(),
          price: priceNum,
          period,
          currency,
          category,
          description: desc.trim(),
        });
      }

      // Notificación local (si la quieres quitar, comenta este bloque)
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title:
              estadoPublicacion === "publicado"
                ? "Artículo publicado"
                : "Borrador guardado",
            body:
              estadoPublicacion === "publicado"
                ? `Tu artículo "${title.trim()}" ya está disponible.`
                : "Tu borrador se guardó correctamente.",
            data: { articuloId },
          },
          trigger: null,
        });
      } catch (notifErr) {
        console.log("Error enviando notificación local", notifErr);
      }

      setToast({
        type: "success",
        title:
          estadoPublicacion === "publicado"
            ? "Artículo publicado"
            : "Borrador guardado",
        message:
          estadoPublicacion === "publicado"
            ? "Tu artículo ahora está disponible para renta."
            : "Podrás continuar editándolo más tarde.",
      });

      setTimeout(() => {
        setToast(null);
        onClose();
      }, 2500);

      resetForm();
    } catch (e: any) {
      setToast({
        type: "error",
        title: "Error al publicar",
        message: e?.message ?? "No se pudo publicar el artículo.",
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        {/* overlay para cerrar tocando fuera */}
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.overlay,
          }}
        />

      <KeyboardAvoidingView
        className="absolute bottom-0 w-full rounded-t-3xl"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ height: "80%", backgroundColor: COLORS.sheetBg }}
      >

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text
              className="text-[18px] font-semibold"
              style={{ color: COLORS.text }}
            >
              Publicar nuevo artículo
            </Text>
            <Pressable
              onPress={onClose}
              className="rounded-full p-1 active:opacity-70"
            >
              <Feather name="x" size={22} color={COLORS.iconMuted} />
            </Pressable>
          </View>

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Título
          </Text>
          <TextInput
            placeholder="Ej. Motosierra Husqvarna 585XP"
            placeholderTextColor={COLORS.iconMuted}
            value={title}
            onChangeText={setTitle}
            className="rounded-2xl px-4 py-3 text-base mb-4"
            style={{
              color: COLORS.text,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          />

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Precio total ingresado
          </Text>
          <View className="flex-row items-center gap-2 mb-2">
            <TextInput
              placeholder="$ 900"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{
                color: COLORS.text,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
            <View className="relative">
              <Pressable
                onPress={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="flex-row items-center gap-1 rounded-2xl px-4 py-3 border"
                style={{
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.card,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                  {currency}
                </Text>
                <Feather
                  name="chevron-down"
                  size={18}
                  color={COLORS.iconMuted}
                />
              </Pressable>

              {showCurrencyMenu && (
                <View
                  className="absolute top-14 right-0 rounded-2xl border z-50"
                  style={{
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.card,
                  }}
                >
                  {(["USD", "MXN", "EUR"] as Currency[]).map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => {
                        setCurrency(c);
                        setShowCurrencyMenu(false);
                      }}
                      className="px-4 py-2"
                    >
                      <Text
                        style={{
                          color: c === currency ? COLORS.accent : COLORS.text,
                          fontWeight: c === currency ? "600" : "400",
                        }}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Periodo (el precio ingresado corresponde a N unidades)
          </Text>

          <View className="flex-row items-center gap-8 mb-3">
            <View>
              <Text
                className="text-[13px] mb-1"
                style={{ color: COLORS.subtext }}
              >
                Cantidad
              </Text>
              <View className="flex-row gap-2 mt-2">
                {(["hour", "day", "week"] as Period[]).map((p) => {
                  const active = p === period;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPeriod(p)}
                      className="px-4 py-2 rounded-2xl border"
                      style={{
                        backgroundColor: active ? COLORS.accent : "transparent",
                        borderColor: active ? COLORS.accent : COLORS.border,
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: active ? "#fff" : COLORS.text }}
                      >
                        {p === "hour" ? "Hora" : p === "day" ? "Día" : "Semana"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ minWidth: 80, marginTop: 27 }}>
              <TextInput
                value={periodQty}
                onChangeText={(t) => setPeriodQty(t.replace(/[^\d]/g, ""))}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={COLORS.iconMuted}
                className="rounded-2xl px-4 py-2 text-base text-center"
                style={{
                  color: COLORS.text,
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              />
            </View>
          </View>

          {price?.trim() && Number(price) > 0 && (
            <Text
              className="text-[13px] mb-6"
              style={{ color: COLORS.subtext }}
            >
              Guardarás:{" "}
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                {currency}{" "}
                {(
                  Number(price) / Math.max(1, parseInt(periodQty || "1", 10))
                ).toFixed(2)}
              </Text>{" "}
              por{" "}
              {period === "hour" ? "hora" : period === "day" ? "día" : "semana"}{" "}
              · Mostrando como:{" "}
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                {currency} {Number(price).toFixed(2)}
              </Text>{" "}
              por {periodQty || "1"}{" "}
              {period === "hour"
                ? "hora(s)"
                : period === "day"
                  ? "día(s)"
                  : "semana(s)"}
              .
            </Text>
          )}

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Condición del artículo
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
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
                    backgroundColor: active ? COLORS.accent : "transparent",
                    borderColor: active ? COLORS.accent : COLORS.border,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: active ? "#fff" : COLORS.text }}
                  >
                    {e.replace("_", " ")}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Estado de publicación
          </Text>
          <View className="flex-row gap-2 mb-6">
            {(["borrador", "publicado"] as EstadoPublicacion[]).map((s) => {
              const active = s === estadoPublicacion;
              return (
                <Pressable
                  key={s}
                  onPress={() => setEstadoPublicacion(s)}
                  className="px-4 py-2 rounded-2xl border"
                  style={{
                    backgroundColor: active ? COLORS.accent : "transparent",
                    borderColor: active ? COLORS.accent : COLORS.border,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: active ? "#fff" : COLORS.text }}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Valores adicionales
          </Text>
          <View className="flex-row gap-2 mb-2 ">
            <TextInput
              placeholder="Valor de reposición"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="numeric"
              value={valorReposicion}
              onChangeText={setValorReposicion}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{
                color: COLORS.text,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
            <TextInput
              placeholder="Depósito seguridad"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="numeric"
              value={depositoSeguridad}
              onChangeText={setDepositoSeguridad}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{
                color: COLORS.text,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          </View>

          <View className="flex-row gap-2 mb-2 py-6">
            <TextInput
              placeholder="Mín. horas (ej. 2)"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="number-pad"
              value={duracionMinHoras}
              onChangeText={setDuracionMinHoras}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{
                color: COLORS.text,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
            <TextInput
              placeholder="Máx. días (ej. 7)"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="number-pad"
              value={duracionMaxDias}
              onChangeText={setDuracionMaxDias}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{
                color: COLORS.text,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          </View>

          <View className="flex-row gap-2 mb-6">
            <TextInput
              placeholder="Cantidad disponible"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="number-pad"
              value={cantidadDisponible}
              onChangeText={setCantidadDisponible}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{
                color: COLORS.text,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          </View>

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Método de entrega
          </Text>
          <View className="flex-row items-center gap-2 mb-3">
            <View className="relative">
              <Pressable
                onPress={() => setShowDeliveryMenu((v) => !v)}
                className="flex-row items-center gap-2 rounded-2xl px-4 py-3 border"
                style={{
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.card,
                  minWidth: 200,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                  {deliveryMode === "retiro"
                    ? "Solo retiro"
                    : "Entrega disponible"}
                </Text>
                <Feather
                  name="chevron-down"
                  size={18}
                  color={COLORS.iconMuted}
                />
              </Pressable>

              {showDeliveryMenu && (
                <View
                  className="absolute top-14 left-0 right-0 z-50 rounded-2xl border"
                  style={{
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.card,
                  }}
                >
                  {(["retiro", "entrega"] as DeliveryMode[]).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setDeliveryMode(m);
                        setShowDeliveryMenu(false);
                        if (m === "retiro") setTarifaEntrega("");
                      }}
                      className="px-4 py-2"
                    >
                      <Text
                        style={{
                          color:
                            m === deliveryMode ? COLORS.accent : COLORS.text,
                          fontWeight: m === deliveryMode ? "600" : "400",
                        }}
                      >
                        {m === "retiro" ? "Solo retiro" : "Entrega disponible"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <TextInput
              editable={deliveryMode === "entrega"}
              placeholder="Tarifa entrega"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="numeric"
              value={tarifaEntrega}
              onChangeText={setTarifaEntrega}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{
                color: COLORS.text,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
                opacity: deliveryMode === "entrega" ? 1 : 0.6,
              }}
            />
          </View>

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Categoría
          </Text>
          <Pressable
            onPress={() => setShowCategories(true)}
            className="rounded-2xl px-4 py-3 flex-row items-center justify-between mb-6"
            style={{
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              className="text-base"
              style={{ color: category ? COLORS.text : COLORS.iconMuted }}
            >
              {category ? category.label : "Elige una categoría"}
            </Text>
            <Feather name="chevron-right" size={20} color={COLORS.iconMuted} />
          </Pressable>

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Descripción
          </Text>
          <TextInput
            placeholder="Detalles, estado, condiciones y políticas de renta…"
            placeholderTextColor={COLORS.iconMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="rounded-2xl px-4 py-3 text-base mb-6"
            style={{
              color: COLORS.text,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          />

          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>
            Fotos
          </Text>
          <View
            className="rounded-2xl mb-6 border bg-white dark:bg-zinc-900"
            style={{ borderColor: COLORS.dashed, borderStyle: "dashed" }}
          >
            {images.length === 0 ? (
              <Pressable
                onPress={pickImages}
                className="h-36 w-full items-center justify-center active:opacity-80"
              >
                <Text className="text-sm" style={{ color: COLORS.subtext }}>
                  Agregar fotos
                </Text>
              </Pressable>
            ) : (
              <View className="p-3">
                <View className="flex-row flex-wrap">
                  {images.map((img, idx) => (
                    <View key={`${img.uri}-${idx}`} className="w-24 h-24 m-1">
                      <Image
                        source={{ uri: img.uri }}
                        className="w-full h-full rounded-xl border"
                        style={{ borderColor: COLORS.border }}
                      />
                      <Pressable
                        onPress={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: isDark ? "#fff" : "rgba(0,0,0,0.85)",
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Quitar imagen"
                      >
                        <Text
                          className="text-xs"
                          style={{ color: isDark ? "#000" : "#fff" }}
                        >
                          Quitar
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    onPress={pickImages}
                    className="w-24 h-24 m-1 items-center justify-center rounded-xl border active:opacity-80"
                    style={{
                      borderColor: COLORS.dashed,
                      borderStyle: "dashed",
                    }}
                  >
                    <Feather name="plus" size={22} color={COLORS.iconMuted} />
                    <Text
                      className="mt-1 text-xs"
                      style={{ color: COLORS.subtext }}
                    >
                      Agregar
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

           <View className="flex-row justify-between mt-2">
              <View className="flex-1 mr-2">
                <Button label="Cancelar" variant="ghost" onPress={onClose} />
              </View>
              <View className="flex-1 ml-2">
                <Button
                  label={
                    loading
                      ? "Guardando…"
                      : estadoPublicacion === "publicado"
                      ? "Publicar"
                      : "Guardar borrador"
                  }
                  variant="primary"
                  onPress={submit}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Toast estilizado */}
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

        <CategoriesSheet
          visible={showCategories}
          onClose={() => setShowCategories(false)}
          onSelect={(cat) => setCategory(cat)}
        />
      </View>
    </Modal>
  );
}