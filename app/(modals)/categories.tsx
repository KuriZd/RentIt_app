import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

export type Category = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  data: Category[];
  onSelect?: (cat: Category) => void;
};

export default function CategoriesSheet({ visible, onClose, data, onSelect }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? data.filter((c) => c.label.toLowerCase().includes(q)) : data;
  }, [query, data]);

  const shadow = Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
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
        <View className="h-9 w-9 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.pill }}>
          <MaterialCommunityIcons name={item.icon} size={18} color={COLORS.icon} />
        </View>
        <Text className="text-[15px] text-neutral-900 dark:text-neutral-100">{item.label}</Text>
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
      <Pressable onPress={onClose} className="absolute inset-0" style={{ backgroundColor: COLORS.overlay }} />

      <View className="absolute bottom-0 w-full rounded-t-3xl bg-white dark:bg-neutral-900" style={{ height: "80%" }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Categories</Text>
          <Pressable onPress={onClose} className="rounded-full p-1 active:opacity-70">
            <Feather name="x" size={22} color={COLORS.iconMuted} />
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-5 mt-3 mb-2">
          <View
            className="flex-row items-center rounded-2xl border px-3 py-2.5"
            style={{ ...shadow, backgroundColor: COLORS.pill, borderColor: COLORS.ring, borderWidth: 1 }}
          >
            <Feather name="search" size={18} color={COLORS.iconMuted} />
            <TextInput
              placeholder="Search categories"
              placeholderTextColor={COLORS.iconMuted}
              value={query}
              onChangeText={setQuery}
              className="ml-2 flex-1 text-[14px] text-neutral-900 dark:text-neutral-100"
            />
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.key}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  );
}
