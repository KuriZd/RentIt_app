import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
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
import CategoriesSheet, { Category } from "./categories";

type Period = "hour" | "day" | "week";
type Currency = "USD" | "MXN" | "EUR";

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
  const [currency, setCurrency] = useState<Currency>("USD");
  const [category, setCategory] = useState<Category | null>(null);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const shadow = Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 2 },
  });

  const submit = async () => {
    if (!title.trim()) return Alert.alert("Falta título", "Agrega un título para tu artículo.");
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      return Alert.alert("Precio inválido", "Ingresa un número mayor a 0.");
    }

    try {
      setLoading(true);
      const payload: NewItemPayload = {
        title: title.trim(),
        price: priceNum,
        period,
        currency,
        category,
        description: desc.trim(),
      };
      if (onPublish) await onPublish(payload);
      Alert.alert("Publicado", "Tu artículo se publicó correctamente.");
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo publicar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="absolute inset-0" style={{ backgroundColor: COLORS.overlay }} />

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
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-[18px] font-semibold" style={{ color: COLORS.text }}>
              Publicar nuevo artículo
            </Text>
            <Pressable onPress={onClose} className="rounded-full p-1 active:opacity-70">
              <Feather name="x" size={22} color={COLORS.iconMuted} />
            </Pressable>
          </View>

          {/* Título */}
          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>Título</Text>
          <TextInput
            placeholder="Ej. Motosierra Husqvarna 585XP"
            placeholderTextColor={COLORS.iconMuted}
            value={title}
            onChangeText={setTitle}
            className="rounded-2xl px-4 py-3 text-base mb-4"
            style={{ color: COLORS.text, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}
          />

          {/* Precio + Moneda */}
          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>Precio</Text>
          <View className="flex-row items-center gap-2 mb-4">
            <TextInput
              placeholder="42"
              placeholderTextColor={COLORS.iconMuted}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              className="flex-1 rounded-2xl px-4 py-3 text-base"
              style={{ color: COLORS.text, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}
            />

            {/* Selector de moneda */}
            <View className="relative">
              <Pressable
                onPress={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="flex-row items-center gap-1 rounded-2xl px-4 py-3 border"
                style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "600" }}>{currency}</Text>
                <Feather name="chevron-down" size={18} color={COLORS.iconMuted} />
              </Pressable>

              {showCurrencyMenu && (
                <View
                  className="absolute top-14 right-0 rounded-2xl border z-50"
                  style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
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

          {/* Periodo */}
          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>Periodo</Text>
          <View className="flex-row gap-2 mb-6">
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
                    {p === "hour" ? "Por hora" : p === "day" ? "Por día" : "Por semana"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Categoría */}
          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>Categoría</Text>
          <Pressable
            onPress={() => setShowCategories(true)}
            className="rounded-2xl px-4 py-3 flex-row items-center justify-between mb-6"
            style={{ backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}
          >
            <Text className="text-base" style={{ color: category ? COLORS.text : COLORS.iconMuted }}>
              {category ? category.label : "Elige una categoría"}
            </Text>
            <Feather name="chevron-right" size={20} color={COLORS.iconMuted} />
          </Pressable>

          {/* Descripción */}
          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>Descripción</Text>
          <TextInput
            placeholder="Detalles, estado, condiciones y políticas de renta…"
            placeholderTextColor={COLORS.iconMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="rounded-2xl px-4 py-3 text-base mb-6"
            style={{ color: COLORS.text, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}
          />

          {/* Fotos */}
          <Text className="text-[15px] mb-2" style={{ color: COLORS.subtext }}>Fotos</Text>
          <Pressable
            onPress={() => Alert.alert("Fotos", "Integraremos ImagePicker en el siguiente paso.")}
            className="rounded-2xl px-4 py-10 items-center justify-center mb-8"
            style={{ borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.dashed, backgroundColor: COLORS.card }}
          >
            <Text style={{ color: COLORS.subtext }}>Agregar fotos</Text>
          </Pressable>

          {/* Botones */}
          <View className="flex-row justify-between mt-2">
            <View className="flex-1 mr-2">
              <Button label="Cancelar" variant="ghost" onPress={onClose} />
            </View>
            <View className="flex-1 ml-2">
              <Button label={loading ? "Publicando…" : "Publicar"} variant="primary" onPress={submit} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker de Categorías */}
      <CategoriesSheet
        visible={showCategories}
        onClose={() => setShowCategories(false)}
        data={DEFAULT_CATEGORIES}
        onSelect={(cat) => setCategory(cat)}
      />
    </Modal>
  );
}

const DEFAULT_CATEGORIES: Category[] = [
  { key: "tools", label: "Tools", icon: "tools" },
  { key: "electronics", label: "Electronics", icon: "cellphone-link" },
  { key: "sports", label: "Sports equipment", icon: "basketball" },
  { key: "vehicles", label: "Vehicles", icon: "car-outline" },
  { key: "household", label: "Household goods", icon: "sofa-outline" },
  { key: "garden", label: "Garden and outdoors", icon: "flower-outline" },
  { key: "games", label: "Games and toys", icon: "puzzle-outline" },
  { key: "office", label: "Office supplies", icon: "briefcase-outline" },
  { key: "others", label: "Others", icon: "dots-horizontal-circle-outline" },
];
