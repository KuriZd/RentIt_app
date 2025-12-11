// app/messages/index.tsx
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type CategoryKey = "all" | "host" | "guest" | "support";
type ReadStatus = "sent" | "delivered" | "read";

type DbMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type DbProfile = {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
};

type Conversation = {
  id: string; // room_id
  name: string;
  last: string;
  time: string;
  avatar?: string | null;
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

function useColors() {
  const isDark = useColorScheme() === "dark";

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

  return {
    ...COLORS,
    bg: isDark ? "#0b0b0c" : "#f9fafb",
    text: isDark ? "#fafafa" : "#111827",
    sub: COLORS.iconMuted,
  };
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
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

function Avatar({ name, uri }: { name: string; uri?: string | null }) {
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

function MessageRow({ item }: { item: Conversation }) {
  const C = useColors();

  return (
    <Link
      href={{ pathname: "/messages/[id]", params: { id: item.id } }}
      asChild
    >
      <Pressable className="py-3 flex-row items-center">
        <Avatar name={item.name} uri={item.avatar} />

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              numberOfLines={1}
              style={
                {
                  color: C.text,
                  fontWeight: item.unread ? "800" : "600",
                  fontSize: 15,
                } as any
              }
            >
              {item.name}
            </Text>

            <Text className="text-xs" style={{ color: C.sub }}>
              {item.time}
            </Text>
          </View>

          <View className="mt-0.5 flex-row items-center">
            {item.status && <ReadReceipt status={item.status} />}
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

// extrae el otro usuario de un room_id tipo "uid1:uid2"
function getOtherUserId(roomId: string, myId: string): string | null {
  if (!roomId.includes(":")) return null;
  const [a, b] = roomId.split(":");
  if (!a || !b) return null;
  if (a === myId) return b;
  if (b === myId) return a;
  return null;
}

export default function MessagesScreen() {
  const C = useColors();
  const [active, setActive] = useState<CategoryKey>("all");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // 1) obtener userId una vez
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) {
          setUserId(data.user?.id ?? null);
        }
      } catch (e) {
        console.error("Error obteniendo usuario actual", e);
        if (!cancelled) setUserId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2) cargar conversaciones + suscripción realtime
  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const { data: msgs, error } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${userId},room_id.like.%${userId}%`)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error cargando mensajes", error);
          if (!cancelled) setConversations([]);
          return;
        }

        if (!msgs || msgs.length === 0) {
          if (!cancelled) setConversations([]);
          return;
        }

        const messages = msgs as DbMessage[];

        // último mensaje por room_id
        const seenRooms = new Set<string>();
        const summaries: {
          roomId: string;
          lastMessage: DbMessage;
          otherUserId: string | null;
        }[] = [];

        for (const m of messages) {
          if (seenRooms.has(m.room_id)) continue;
          seenRooms.add(m.room_id);
          const otherId = getOtherUserId(m.room_id, userId);
          summaries.push({
            roomId: m.room_id,
            lastMessage: m,
            otherUserId: otherId,
          });
        }

        // perfiles de los otros usuarios
        const otherIds = Array.from(
          new Set(
            summaries
              .map((s) => s.otherUserId)
              .filter(Boolean) as string[]
          )
        );

        let profilesMap = new Map<string, DbProfile>();

        if (otherIds.length > 0) {
          const { data: profiles, error: pErr } = await supabase
            .from("perfiles")
            .select("id, nombre, avatar_url")
            .in("id", otherIds);

          if (!pErr && profiles) {
            profilesMap = new Map(
              (profiles as DbProfile[]).map((p) => [p.id, p])
            );
          }
        }

        const convs: Conversation[] = summaries.map((s) => {
          const profile = s.otherUserId
            ? profilesMap.get(s.otherUserId)
            : undefined;
          const createdAt = new Date(s.lastMessage.created_at);

          return {
            id: s.roomId,
            name:
              profile?.nombre ??
              (s.otherUserId ? "Usuario" : `Chat ${s.roomId}`),
            avatar: profile?.avatar_url ?? null,
            last: s.lastMessage.content,
            time: createdAt.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            category: "guest", // placeholder
            status:
              s.lastMessage.sender_id === userId ? "sent" : undefined,
            unread: false,
          };
        });

        if (!cancelled) setConversations(convs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // suscripción realtime a nuevos mensajes
    const channel = supabase
      .channel(`messages-overview:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as DbMessage;

          // solo recargar si el mensaje me involucra
          if (
            row.sender_id !== userId &&
            !row.room_id.includes(userId)
          ) {
            return;
          }

          // recargar lista
          load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const data =
    active === "all"
      ? conversations
      : conversations.filter((m) => m.category === active);

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
              active={active === (c.key as CategoryKey)}
              onPress={() => setActive(c.key as CategoryKey)}
            />
          ))}
        </View>
      </View>

      {/* Lista / Loading / Empty */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : data.length === 0 ? (
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
