// app/messages/index.tsx
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Image,
    Pressable,
    Text,
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CategoryKey = "all" | "host" | "guest" | "support";
type ReadStatus = "sent" | "delivered" | "read";

type Message = {
  id: string;
  name: string;
  last: string;
  time: string;
  avatar?: string;
  category: Exclude<CategoryKey, "all">;
  status?: ReadStatus;
  unread?: boolean;
};

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "host", label: "Propietario" },
  { key: "guest", label: "Rentas" },
  { key: "support", label: "Asistencia" },
];

const MESSAGES: Message[] = [
  {
    id: "1",
    name: "Yayo (Junior)",
    last: "Donde andan???",
    time: "10:20 a. m.",
    category: "guest",
    status: "read",
    unread: false,
  },
  {
    id: "2",
    name: "Giuli🧠 Toscana",
    last: "Que ayer me quedé bieeeen tieso te…",
    time: "08:53 a. m.",
    category: "host",
    status: "delivered",
    unread: true,
  },
  {
    id: "3",
    name: "Soporte RentIt",
    last: "Tu caso fue actualizado.",
    time: "Ayer",
    category: "support",
    status: "sent",
  },
];

function useColors() {
  const isDark = useColorScheme() === "dark";

  const COLORS = useMemo(
    () => ({
      bg: isDark ? "#0b0b0c" : "#f9fafb",
      icon: isDark ? "#e5e7eb" : "#111827",
      ring: isDark ? "#3f3f46" : "#e5e7eb",

      // extras necesarios para texto y pills
      text: isDark ? "#fafafa" : "#111827",
      sub: isDark ? "#a1a1aa" : "#6b7280",
      pill: isDark ? "#27272a" : "#f3f4f6",
    }),
    [isDark]
  );

  return COLORS;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const C = useColors();

  return (
    <Pressable
      onPress={onPress}
      className="px-4 py-2 rounded-full mr-2 mb-2 border"
      style={{
        backgroundColor: active ? C.icon : C.pill,
        borderColor: active ? C.icon : C.ring,
      }}
    >
      <Text
        className="font-medium"
        style={{ color: active ? "#fff" : C.icon }}
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
      <View
        className="h-16 w-16 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: C.pill }}
      >
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

function Avatar({ name, uri }: { name: string; uri?: string }) {
  const C = useColors();
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return uri ? (
    <Image
      source={{ uri }}
      className="h-12 w-12 rounded-full mr-3"
      style={{ backgroundColor: C.pill }}
    />
  ) : (
    <View
      className="h-12 w-12 rounded-full items-center justify-center mr-3"
      style={{ backgroundColor: C.pill }}
    >
      <Text style={{ color: C.text, fontWeight: "600" }}>{initials}</Text>
    </View>
  );
}

function ReadReceipt({ status }: { status: ReadStatus }) {
  const C = useColors();
  const base = C.sub;
  const readBlue = "#3AB4FF";

  const color = status === "read" ? readBlue : base;

  if (status === "sent") {
    return <Feather name="check" size={14} color={base} />;
  }

  return (
    <View className="flex-row items-center">
      <Feather name="check" size={14} color={color} />
      <Feather name="check" size={14} color={color} style={{ marginLeft: -6 }} />
    </View>
  );
}

function MessageRow({ item }: { item: Message }) {
  const C = useColors();

  return (
    <Link href={`./messages/${item.id}`} asChild>
      <Pressable className="py-3 flex-row items-center">
        <Avatar name={item.name} uri={item.avatar} />

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              numberOfLines={1}
              style={{
                color: C.text,
                fontWeight: item.unread ? "800" : "600",
                fontSize: 15,
              }}
            >
              {item.name}
            </Text>

            <Text className="text-xs" style={{ color: C.sub }}>
              {item.time}
            </Text>
          </View>

          <View className="mt-0.5 flex-row items-center">
            <ReadReceipt status={item.status || "sent"} />

            <Text
              numberOfLines={1}
              className="ml-1 text-sm"
              style={{ color: C.sub }}
            >
              {item.last}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function MessagesScreen() {
  const C = useColors();
  const [active, setActive] = useState<CategoryKey>("all");

  const data =
    active === "all"
      ? MESSAGES
      : MESSAGES.filter((m) => m.category === active);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      {/* Top */}
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold" style={{ color: C.text }}>
          Mensajes
        </Text>

        <View className="flex-row items-center gap-2">
          <Pressable
            className="h-10 w-10 rounded-full items-center justify-center"
            style={{ backgroundColor: C.pill }}
          >
            <Feather name="search" size={18} color={C.icon} />
          </Pressable>

          <Pressable
            className="h-10 w-10 rounded-full items-center justify-center"
            style={{ backgroundColor: C.pill }}
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
              onPress={() => setActive(c.key as CategoryKey)}
            />
          ))}
        </View>
      </View>

      {/* Lista */}
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => (
            <View className="h-px" style={{ backgroundColor: C.ring }} />
          )}
          renderItem={({ item }) => <MessageRow item={item} />}
        />
      )}
    </SafeAreaView>
  );
}
