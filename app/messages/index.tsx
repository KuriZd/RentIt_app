// app/messages/index.tsx
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Platform,
    Pressable,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CategoryKey = "all" | "host" | "guest" | "support";

type Message = {
  id: string;
  title: string;
  last: string;
  category: Exclude<CategoryKey, "all">;
  unread?: boolean;
};

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "host", label: "Hospedar" },
  { key: "guest", label: "Huésped" },
  { key: "support", label: "Asistencia" },
];

// Si quieres arrancar con lista vacía como en el mock:
const MESSAGES: Message[] = [];

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return useMemo(
    () => ({
      isDark,
      bg: isDark ? "#0b0b0c" : "#ffffff",
      card: isDark ? "#0f1115" : "#ffffff",
      text: isDark ? "#fafafa" : "#111827",
      sub: isDark ? "#a1a1aa" : "#6b7280",
      pill: isDark ? "#27272a" : "#f3f4f6",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      icon: isDark ? "#e5e7eb" : "#111827",
    }),
    [isDark]
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        "px-4 py-2 rounded-full mr-2 mb-2 border",
        active
          ? "bg-black border-black"
          : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
      ].join(" ")}
      style={
        Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          },
          android: { elevation: 0 },
          default: {},
        }) as any
      }
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text
        className={active ? "text-white font-semibold" : "text-neutral-700 dark:text-neutral-200 font-medium"}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState() {
  const C = useColors();
  return (
    <View className="flex-1 items-center justify-center">
      <View className="h-16 w-16 rounded-full items-center justify-center bg-neutral-100 dark:bg-neutral-800 mb-3">
        <Feather name="message-square" size={28} color={C.icon} />
      </View>
      <Text className="text-lg font-semibold" style={{ color: C.text }}>
        No tienes ningún mensaje.
      </Text>
      <Text className="mt-1 text-sm text-center" style={{ color: C.sub }}>
        Cuando recibas un mensaje nuevo, aparecerá aquí.
      </Text>
    </View>
  );
}

export default function MessagesScreen() {
  const C = useColors();
  const [active, setActive] = useState<CategoryKey>("all");

  const data = useMemo(() => {
    if (active === "all") return MESSAGES;
    return MESSAGES.filter((m) => m.category === active);
  }, [active]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      {/* Top bar */}
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold tracking-tight" style={{ color: C.text }}>
          Mensajes
        </Text>

        <View className="flex-row items-center gap-2">
          <Pressable
            className="h-10 w-10 rounded-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
            accessibilityLabel="Buscar"
          >
            <Feather name="search" size={18} color={C.icon} />
          </Pressable>
          <Pressable
            className="h-10 w-10 rounded-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
            accessibilityLabel="Ajustes"
          >
            <Feather name="settings" size={18} color={C.icon} />
          </Pressable>
        </View>
      </View>

      {/* Chips */}
      <View className="px-5">
        <View className="flex-row flex-wrap">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              active={active === c.key}
              onPress={() => setActive(c.key)}
            />
          ))}
        </View>
      </View>

      {/* Lista / vacío */}
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
          )}
          renderItem={({ item }) => (
            <Pressable className="py-4">
              <Text className="text-base font-medium mb-1" style={{ color: C.text }}>
                {item.title}
              </Text>
              <Text className="text-sm" style={{ color: C.sub }}>
                {item.last}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
