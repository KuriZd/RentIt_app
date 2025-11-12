import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { supabase } from "../../utils/supabase";

export type Category = {
  key: string; // id de la categoría (string para FlatList)
  label: string; // nombre
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (cat: Category) => void;
};

const iconBySlug: Record<string, Category["icon"]> = {
  muebles: "sofa-outline",
  herramientas: "tools",
  camping: "tent",
  electronica: "cellphone-link",
  jardín: "flower-outline",
  jardin: "flower-outline",
  default: "dots-horizontal-circle-outline",
};

export default function CategoriesSheet({ visible, onClose, onSelect }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<Category[]>([]);

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
      text: isDark ? "#fafafa" : "#111827",
      card: isDark ? "#0b0b0c" : "#ffffff",
      border: isDark ? "#3f3f46" : "#e5e7eb",
    }),
    [isDark]
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, slug")
        .order("nombre", { ascending: true });

      if (!alive) return;

      if (error) {
        console.warn("[categorias] error:", error.message);
        setErrorMsg(error.message);
        setData([]);
      } else {
        const mapped: Category[] = (data ?? []).map((c: any) => ({
          key: String(c.id),
          label: c.nombre ?? "",
          icon: iconBySlug[(c.slug ?? "").toLowerCase()] ?? iconBySlug.default,
        }));
        setData(mapped);
      }
      setLoading(false);
    }
    if (visible) load();
    return () => {
      alive = false;
    };
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? data.filter((c) => c.label.toLowerCase().includes(q)) : data;
  }, [query, data]);

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
  });

  const renderItem = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() => {
        onSelect?.(item);
        onClose();
      }}
      className="flex-row items-center justify-between px-3 py-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
      style={shadow}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-9 w-9 rounded-full items-center justify-center"
          style={{ backgroundColor: COLORS.pill }}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={18}
            color={COLORS.icon}
          />
        </View>
        <Text className="text-[15px]" style={{ color: COLORS.text }}>
          {item.label}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.iconMuted} />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="absolute inset-0"
        style={{ backgroundColor: COLORS.overlay }}
      />

      <View
        className="absolute bottom-0 w-full rounded-t-3xl"
        style={{ height: "80%", backgroundColor: COLORS.card }}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 pt-3 pb-2"
          style={{ borderBottomWidth: 1, borderColor: COLORS.border }}
        >
          <Text
            className="text-lg font-semibold"
            style={{ color: COLORS.text }}
          >
            Categories
          </Text>
          <Pressable
            onPress={onClose}
            className="rounded-full p-1 active:opacity-70"
          >
            <Feather name="x" size={22} color={COLORS.iconMuted} />
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-5 mt-3 mb-2">
          <View
            className="flex-row items-center rounded-2xl px-3 py-2.5"
            style={{
              ...shadow,
              backgroundColor: COLORS.pill,
              borderWidth: 1,
              borderColor: COLORS.ring,
            }}
          >
            <Feather name="search" size={18} color={COLORS.iconMuted} />
            <TextInput
              placeholder="Search categories"
              placeholderTextColor={COLORS.iconMuted}
              value={query}
              onChangeText={setQuery}
              className="ml-2 flex-1 text-[14px]"
              style={{ color: COLORS.text }}
            />
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text style={{ color: COLORS.iconMuted, marginTop: 8 }}>
              Cargando categorías…
            </Text>
          </View>
        ) : errorMsg ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ color: COLORS.iconMuted, textAlign: "center" }}>
              No pudimos cargar categorías{"\n"}
              {errorMsg}
            </Text>
            <Pressable
              onPress={onClose}
              className="mt-4 px-4 py-2 rounded-xl"
              style={{ backgroundColor: COLORS.pill }}
            >
              <Text style={{ color: COLORS.text }}>Cerrar</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ color: COLORS.iconMuted }}>
              No hay categorías para mostrar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it) => it.key}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  );
}
