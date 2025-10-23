import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../../components/ui/button";

type Period = "day" | "hour" | "week";

export default function NewItemModal() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [period, setPeriod] = useState<Period>("day");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    // validación mínima
    if (!title.trim()) return Alert.alert("Falta título", "Agrega un título para tu artículo.");
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      return Alert.alert("Precio inválido", "Ingresa un número mayor a 0.");
    }

    try {
      setLoading(true);
      // TODO: aquí va tu inserción a Supabase (tabla: items) ALEXIS

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

        {/* Periodo (segmented control simple) */}
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

        {/* Categoría (input simple; luego lo cambiamos a picker) */}
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

        {/* (Opcional) Fotos: botón placeholder */}
        <View className="h-4" />
        <Text className="text-[15px] mb-2 text-neutral-600 dark:text-neutral-300">Fotos</Text>
        <Pressable
          onPress={() => Alert.alert("Fotos", "Integramos ImagePicker en el siguiente paso.")}
          className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-10 items-center justify-center"
        >
          <Text className="text-neutral-600 dark:text-neutral-300">Agregar fotos</Text>
        </Pressable>

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
