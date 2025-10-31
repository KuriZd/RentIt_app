import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../../components/ui/button";
import { supabase } from "../../utils/supabase";

type Period = "day" | "hour" | "week";

type LocalAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export default function NewItemModal() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [period, setPeriod] = useState<Period>("day");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState<LocalAsset[]>([]);

  const pickImages = async () => {
    // Pide permisos (iOS/Android)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Concede permiso para acceder a tus fotos.");
      return;
    }

    // iOS/web soportan multiple; Android no. Igual manejamos ambos.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // iOS/web
      quality: 0.85,
      selectionLimit: 6, // iOS 14+, web
    });

    if (result.canceled) return;

    // Normalizamos a nuestro arreglo de assets
    const picked = result.assets?.map(a => ({
      uri: a.uri,
      mimeType: (a as any).mimeType ?? null,
      fileName: (a as any).fileName ?? null,
    })) ?? [];

    // En Android (sin multiple), assets tendrá tamaño 1; aquí simplemente agregamos.
    setImages(prev => {
      const merged = [...prev, ...picked];
      // Evita > 10 imágenes por si acaso
      return merged.slice(0, 10);
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

type UnidadPrecio = "hora" | "dia" | "semana"; // ajusta si tu enum usa otros literales

// mapea tu UI (hour/day/week) -> enum BD (hora/dia/semana)
const mapPeriodToUnidad = (p: "hour" | "day" | "week"): UnidadPrecio =>
  p === "hour" ? "hora" : p === "day" ? "dia" : "semana";

  const uploadToSupabase = async (userId: string) => {
  const uploads = await Promise.all(
    images.map(async (img, i) => {
      // 1) leer como ArrayBuffer (sin blob)
      const res = await fetch(img.uri);
      const ab = await res.arrayBuffer();

      // 2) deducir content-type/ext
      const contentType =
        img.mimeType && img.mimeType !== "" ? img.mimeType : "image/jpeg";
      const ext = contentType.split("/")[1] || "jpg";

      // 3) nombre y path
      const base =
        (img.fileName?.replace(/\s+/g, "_").replace(/[^\w\.-]/g, "")) ||
        `photo_${i}.${ext}`;
      const filename = base.includes(".") ? base : `${base}.${ext}`;
      const path = `${userId}/${Date.now()}_${i}_${filename}`;

      // 4) subir ArrayBuffer directo
      const { error } = await supabase
        .storage
        .from("items")
        .upload(path, ab, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw new Error(`Error subiendo ${filename}: ${error.message}`);

      const { data } = supabase.storage.from("items").getPublicUrl(path);
      return data.publicUrl as string;
    })
  );

  return uploads;
};



  const onSubmit = async () => {
    // validación mínima
    if (!title.trim())
      return Alert.alert("Falta título", "Agrega un título para tu artículo.");

    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      return Alert.alert("Precio inválido", "Ingresa un número mayor a 0.");
    }

    try {
      setLoading(true);

      // Usuario actual
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        throw new Error("No hay sesión activa.");
      }
      const userId = userData.user.id;

      // 1) Subir imágenes (si hay)
      const imageUrls = images.length ? await uploadToSupabase(userId) : [];

      // 2) Insertar item
      const { error: insertErr } = await supabase
        .from("articulos")
        .insert({
          id_propietario: userId,
          id_categoria: null, // o el ID de categoría seleccionada
          titulo: title.trim(),
          descripcion: desc.trim(),
          precio: priceNum,
          unidad_precio: period,      // por hora/día/semana
          publicado_en: new Date().toISOString(),
          estado_publicacion: "publicado" // o el enum que uses
        });

      if (insertErr) throw new Error(insertErr.message);

      Alert.alert("Publicado", "Tu artículo se publicó correctamente.");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo publicar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-white dark:bg-neutral-900"
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título */}
        <Text className="text-[15px] mb-2 text-neutral-600 dark:text-neutral-300">Título</Text>
        <TextInput
          placeholder="Ej. Motosierra Husqvarna 585XP"
          value={title}
          onChangeText={setTitle}
          className="rounded-2xl border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-base text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900"
        />

        {/* Precio */}
        <View className="h-4" />
        <Text className="text-[15px] mb-2 text-neutral-600 dark:text-neutral-300">Precio</Text>
        <View className="flex-row items-center gap-3">
          <TextInput
            placeholder="42"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            className="flex-1 rounded-2xl border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-base text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900"
          />
          <Text className="text-neutral-900 dark:text-neutral-100">$ USD</Text>
        </View>

        {/* Periodo */}
        <View className="h-4" />
        <Text className="text-[15px] mb-2 text-neutral-600 dark:text-neutral-300">Periodo</Text>
        <View className="flex-row gap-2">
          {(["hour", "day", "week"] as Period[]).map((p) => {
            const active = p === period;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                className={
                  "px-4 py-2 rounded-2xl border " +
                  (active
                    ? "bg-black/90 dark:bg-white border-black/90 dark:border-white"
                    : "bg-transparent border-neutral-300 dark:border-neutral-700")
                }
              >
                <Text
                  className={
                    "text-sm " + (active ? "text-white dark:text-black" : "text-neutral-900 dark:text-neutral-100")
                  }
                >
                  {p === "hour" ? "por hora" : p === "day" ? "por día" : "por semana"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Categoría */}
        <View className="h-4" />
        <Text className="text-[15px] mb-2 text-neutral-600 dark:text-neutral-300">Categoría</Text>
        <TextInput
          placeholder="Ej. Herramientas"
          value={category}
          onChangeText={setCategory}
          className="rounded-2xl border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-base text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900"
        />

        {/* Descripción */}
        <View className="h-4" />
        <Text className="text-[15px] mb-2 text-neutral-600 dark:text-neutral-300">Descripción</Text>
        <TextInput
          placeholder="Detalles, estado, condiciones y políticas de renta…"
          value={desc}
          onChangeText={setDesc}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="rounded-2xl border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-base text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900"
        />

        {/* Fotos */}
        <View className="h-4" />
        <Text className="text-[15px] mb-2 text-neutral-600 dark:text-neutral-300">Fotos</Text>

        {/* Botón para elegir */}
        <Pressable
          onPress={pickImages}
          className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-6 items-center justify-center"
        >
          <Text className="text-neutral-800 dark:text-neutral-100 font-medium">
            {images.length ? "Agregar más fotos" : "Agregar fotos"}
          </Text>
          <Text className="text-xs mt-1 text-neutral-500 dark:text-neutral-300">
            Hasta 10 fotos (iOS/web múltiple; Android 1 por selección)
          </Text>
        </Pressable>

        {/* Previews */}
        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 10 }}
          >
            {images.map((img, idx) => (
              <View key={`${img.uri}-${idx}`} className="relative">
                <Image
                  source={{ uri: img.uri }}
                  className="w-28 h-28 rounded-xl border border-neutral-200 dark:border-neutral-700"
                />
                <Pressable
                  onPress={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-black/80 dark:bg-white px-2 py-1 rounded-full"
                >
                  <Text className="text-white dark:text-black text-xs">Quitar</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Botones */}
        <View className="h-6" />
        <View className="flex-row gap-3">
          <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
          <Button label={loading ? "Publicando…" : "Publicar"} variant="primary" onPress={onSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}