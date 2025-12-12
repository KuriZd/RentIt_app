import { Entypo, Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import CategoriesSheet, { Category } from "../app/(modals)/categories";
import NewItemSheet from "../app/(modals)/new-item";

type Props = {
  query: string; // ✅ texto actual de búsqueda
  onQueryChange: (q: string) => void; // ✅ actualiza el query en el padre
  onSearchPress?: () => void;
  onSellPress?: () => void;
  onCategorySelected?: (cat: Category) => void;
};

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
});

const ripple =
  Platform.OS === "android"
    ? { android_ripple: { color: "#e5e5e5" as any } }
    : {};

export default function HeaderSearch({
  query,
  onQueryChange,
  onSearchPress,
  onSellPress,
  onCategorySelected,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [showCategories, setShowCategories] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      text: isDark ? "#fafafa" : "#111827",
      subtext: isDark ? "#a1a1aa" : "#52525b",
    }),
    [isDark]
  );

  const handleSubmit = () => {
    if (onSearchPress) onSearchPress();
  };

  return (
    <>
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-transparent border-b border-neutral-200 dark:border-neutral-800">
        {/* Search pill con input + botón de limpiar */}
        <View
          className="flex-row items-center rounded-full px-4 py-3"
          style={[shadow, { backgroundColor: COLORS.pill }]}
        >
          <Feather name="search" size={22} color={COLORS.icon} />

          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Busca artículos en RentIt"
            placeholderTextColor={COLORS.subtext}
            className="ml-2 flex-1 text-base"
            style={{ color: COLORS.text }}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />

          {query.length > 0 && (
            <Pressable
              onPress={() => onQueryChange("")}
              hitSlop={10}
              className="ml-2"
            >
              <Feather name="x-circle" size={18} color={COLORS.icon} />
            </Pressable>
          )}
        </View>

        {/* Action pills */}
        <View className="flex-row gap-3 mt-3">
          {/* Sell */}
          <Pressable
            {...ripple}
            onPress={() => setShowNewItem(true)}
            className="flex-1 flex-row items-center justify-center rounded-full px-4 py-2.5"
            style={[shadow, { backgroundColor: COLORS.pill }]}
          >
            <View className="mr-2">
              <Entypo name="price-tag" size={20} color={COLORS.icon} />
            </View>
            <Text
              className="text-lg font-medium"
              style={{ color: COLORS.text }}
            >
              Sell
            </Text>
          </Pressable>

          {/* Categories */}
          <Pressable
            {...ripple}
            onPress={() => setShowCategories(true)}
            className="flex-1 flex-row items-center justify-center rounded-full px-4 py-2.5"
            style={[shadow, { backgroundColor: COLORS.pill }]}
          >
            <View className="mr-2">
              <Feather name="menu" size={22} color={COLORS.icon} />
            </View>
            <Text
              className="text-lg font-medium"
              style={{ color: COLORS.text }}
            >
              Categories
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Categorías (desde Supabase, sin prop data) */}
      <CategoriesSheet
        visible={showCategories}
        onClose={() => setShowCategories(false)}
        onSelect={onCategorySelected}
      />

      {/* New Item Sheet */}
      <NewItemSheet
        visible={showNewItem}
        onClose={() => setShowNewItem(false)}
        onPublish={async (payload) => {
          // Aquí conectas a Supabase cuando publiques artículos
          console.log("Publishing item:", payload);
          if (onSellPress) onSellPress();
        }}
      />
    </>
  );
}
