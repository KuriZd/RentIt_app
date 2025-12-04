// app/messages/[id].tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type ReadStatus = "sent" | "delivered" | "read";

type DbMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ChatMessage = {
  id: string;
  from: "me" | "them";
  text?: string;
  time: string;
  date: string;
  status?: ReadStatus;
};

type Profile = {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
};

const AVATAR_FALLBACK =
  "https://ui-avatars.com/api/?background=111827&color=fff&name=R";

function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => setHeight(e.endCoordinates?.height ?? 0);
    const onHide = () => setHeight(0);

    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  return height;
}

function useColors() {
  const isDark = useColorScheme() === "dark";

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",

      bg: isDark ? "#020617" : "#f9fafb",
      text: isDark ? "#fafafa" : "#111827",
      sub: isDark ? "#a1a1aa" : "#6b7280",
      bubbleMe: isDark ? "#1f2937" : "#111827",
      bubbleThem: isDark ? "#18181b" : "#ffffff",
      bubbleBorder: isDark ? "#27272f" : "#e5e7eb",
      sendBtn: isDark ? "#2563eb" : "#111827",
    }),
    [isDark]
  );

  return COLORS;
}

function ReadReceipt({ status }: { status?: ReadStatus }) {
  const C = useColors();
  const base = C.sub;
  const readBlue = "#3AB4FF";
  const color = status === "read" ? readBlue : base;
  if (status === "sent")
    return <Feather name="check" size={12} color={base} />;
  return (
    <View className="flex-row items-center">
      <Feather name="check" size={12} color={color} />
      <Feather
        name="check"
        size={12}
        color={color}
        style={{ marginLeft: -5 }}
      />
    </View>
  );
}

function DateSeparator({ label }: { label: string }) {
  const C = useColors();
  return (
    <View className="items-center my-2">
      <View
        className="px-3 py-1 rounded-full"
        style={{ backgroundColor: C.pill }}
      >
        <Text className="text-xs" style={{ color: C.sub }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const C = useColors();
  const isMe = m.from === "me";
  return (
    <View
      className="mb-2 px-3"
      style={{ alignItems: isMe ? "flex-end" : "flex-start" }}
    >
      <View
        className="max-w-[86%] rounded-2xl px-3 py-2"
        style={{
          backgroundColor: isMe ? C.bubbleMe : C.bubbleThem,
          borderWidth: isMe ? 0 : 1,
          borderColor: C.bubbleBorder,
          borderTopRightRadius: isMe ? 6 : 16,
          borderTopLeftRadius: isMe ? 16 : 6,
        }}
      >
        {!!m.text && (
          <Text
            className="text-[15px]"
            style={{ color: isMe ? "#ffffff" : C.text }}
          >
            {m.text}
          </Text>
        )}
        <View className="flex-row items-center mt-1 self-end">
          <Text
            className="text-[11px] mr-1"
            style={{ color: isMe ? "#d1d5db" : C.sub }}
          >
            {m.time}
          </Text>
          {isMe && <ReadReceipt status={m.status} />}
        </View>
      </View>
    </View>
  );
}

/** Helpers: DB -> UI **/

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - d.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

function mapDbToChat(row: DbMessage, currentUserId: string | null): ChatMessage {
  const d = new Date(row.created_at);
  return {
    id: row.id,
    from: row.sender_id === currentUserId ? "me" : "them",
    text: row.content,
    time: d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: formatDateLabel(d),
    status: row.sender_id === currentUserId ? "sent" : undefined,
  };
}

// extrae el otro usuario de un room_id tipo "uid1:uid2"
function getOtherUserId(roomId: string, myId: string | null): string | null {
  if (!roomId || !myId) return null;
  if (!roomId.includes(":")) return null;
  const [a, b] = roomId.split(":");
  if (!a || !b) return null;
  if (a === myId) return b;
  if (b === myId) return a;
  return null;
}

export default function ChatDetail() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [value, setValue] = useState("");
  const [composerH, setComposerH] = useState(52);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const kb = useKeyboardHeight();

  const [rawMessages, setRawMessages] = useState<DbMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

  /** 1) cargar usuario + mensajes iniciales **/
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id ?? null;
        if (!cancelled) setUserId(uid);

        if (!id) return;

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error al cargar mensajes", error);
          return;
        }

        if (!cancelled && data) {
          setRawMessages(data as DbMessage[]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /** 2) determinar el otro usuario a partir del room_id **/
  useEffect(() => {
    if (!id || !userId) return;
    const other = getOtherUserId(String(id), userId);
    setOtherUserId(other);
  }, [id, userId]);

  /** 3) cargar perfil del otro usuario **/
  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, avatar_url")
        .eq("id", otherUserId)
        .maybeSingle();

      if (!cancelled && !error && data) {
        setOtherProfile(data as Profile);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  /** 4) suscripción realtime a nuevos mensajes **/
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`room:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${id}`,
        },
        (payload) => {
          const row = payload.new as DbMessage;
          setRawMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  /** 5) DB -> UI messages **/
  const messages = useMemo(
    () =>
      rawMessages
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        )
        .map((row) => mapDbToChat(row, userId)),
    [rawMessages, userId]
  );

  // para trabajar cómodo con FlatList invertida
  const listData = useMemo(
    () => messages.slice().reverse(),
    [messages]
  );

  const scrollToBottom = (animated = true) => {
    listRef.current?.scrollToOffset({ offset: 0, animated });
  };

  const onSend = async () => {
    if (!value.trim() || !id || !userId) return;
    const content = value.trim();
    setValue("");
    scrollToBottom(false);

    const { error } = await supabase.from("messages").insert({
      room_id: id,
      sender_id: userId,
      content,
    });

    if (error) {
      console.error("Error al enviar mensaje", error);
    }
  };

  useEffect(() => {
    if (kb > 0) {
      const t = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(t);
    }
  }, [kb]);

  const displayName = otherProfile?.nombre ?? "Chat";
  const avatarUri = otherProfile?.avatar_url ?? AVATAR_FALLBACK;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <View
        className="px-3 py-2.5 flex-row items-center justify-between"
        style={{ borderBottomWidth: 1, borderBottomColor: C.ring }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="pr-2">
            <Feather name="chevron-left" size={26} color={C.icon} />
          </Pressable>
          <Image
            source={{ uri: avatarUri }}
            className="h-11 w-11 rounded-full mr-2"
            style={{ backgroundColor: C.pill }}
          />
          <View>
            <Text
              className="text-base font-semibold"
              style={{ color: C.text }}
            >
              {displayName}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: C.sub }}>
              Mensajes privados
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: C.pill }}
          >
            <Feather name="phone" size={18} color={C.icon} />
          </Pressable>
          <Pressable
            className="h-9 w-9 items-center justify-center ml-2 rounded-full"
            style={{ backgroundColor: C.pill }}
          >
            <Feather name="more-vertical" size={18} color={C.icon} />
          </Pressable>
        </View>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(i) => i.id}
        renderItem={({ item, index }) => {
          const prev = listData[index - 1];
          const showDate = !prev || prev.date !== item.date;
          return (
            <View>
              {showDate && <DateSeparator label={item.date} />}
              <Bubble m={item} />
            </View>
          );
        }}
        inverted
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: composerH + insets.bottom + 8,
        }}
        onContentSizeChange={() => scrollToBottom(false)}
        ListEmptyComponent={
          <View className="items-center mt-4">
            <Text style={{ color: C.sub, fontSize: 13 }}>
              Aún no hay mensajes. Escribe el primero 👋
            </Text>
          </View>
        }
      />

      {/* Composer */}
      <View
        onLayout={(e) => setComposerH(e.nativeEvent.layout.height)}
        className="px-3 py-2 flex-row items-end"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: kb > 0 ? kb : insets.bottom,
          borderTopWidth: 1,
          borderTopColor: C.ring,
          backgroundColor: C.bg,
        }}
      >
        <Pressable
          className="h-11 w-11 items-center justify-center mr-2 rounded-full"
          style={{ backgroundColor: C.pill }}
        >
          <Feather name="paperclip" size={18} color={C.iconMuted} />
        </Pressable>

        <View
          className="flex-1 rounded-2xl px-3 py-2"
          style={{ backgroundColor: C.pill }}
        >
          <TextInput
            placeholder="Escribe un mensaje..."
            placeholderTextColor={C.sub}
            value={value}
            onChangeText={setValue}
            multiline
            onFocus={() => scrollToBottom(false)}
            style={{
              color: C.text,
              maxHeight: 120,
              fontSize: 15,
              lineHeight: 20,
            }}
          />
        </View>

        <Pressable
          onPress={onSend}
          disabled={!value.trim() || !userId}
          className="h-11 w-11 items-center justify-center ml-2 rounded-full"
          style={{
            backgroundColor: value.trim() && userId ? C.sendBtn : C.pill,
          }}
        >
          <Feather
            name="send"
            size={18}
            color={value.trim() && userId ? "#ffffff" : C.icon}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
