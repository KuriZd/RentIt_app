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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ReadStatus = "sent" | "delivered" | "read";
type ChatMessage = {
  id: string;
  from: "me" | "them";
  text?: string;
  time: string;
  date: string;
  status?: ReadStatus;
};

const AVATAR_FALLBACK =
  "sandbox:/mnt/data/a7d1b698-f792-420e-92aa-ddc64c723447.png";

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

export default function ChatDetail() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [value, setValue] = useState("");
  const [composerH, setComposerH] = useState(52);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const kb = useKeyboardHeight();

  const chatMeta = useMemo(
    () =>
      ({
        "1": {
          name: "Yayo (Junior)",
          avatar: AVATAR_FALLBACK,
          status: "en línea",
        },
        "2": {
          name: "Giuli🧠 Toscana",
          avatar: AVATAR_FALLBACK,
          status: "últ. vez hoy 08:54",
        },
        "3": {
          name: "Soporte RentIt",
          avatar: AVATAR_FALLBACK,
          status: "respuesta en minutos",
        },
      }[String(id)] || {
        name: `Chat ${id}`,
        avatar: AVATAR_FALLBACK,
        status: "—",
      }),
    [id]
  );

  const DATA: ChatMessage[] = useMemo(
    () =>
      [
        {
          id: "d1",
          from: "them" as const,
          text: "Hola, ¿cómo vas?",
          time: "08:40",
          date: "Hoy",
        },
        {
          id: "d2",
          from: "me" as const,
          text: "Todo bien, cerrando pendientes.",
          time: "08:41",
          date: "Hoy",
          status: "delivered" as const,
        },
        {
          id: "d3",
          from: "them" as const,
          text: "¿A qué hora llegan?",
          time: "10:20",
          date: "Hoy",
        },
        {
          id: "d4",
          from: "me" as const,
          text: "En 15 min. Voy saliendo.",
          time: "10:22",
          date: "Hoy",
          status: "read" as const,
        },
      ].reverse(),
    []
  );

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prev = DATA[index - 1];
    const showDate = !prev || prev.date !== item.date;
    return (
      <View>
        {showDate && <DateSeparator label={item.date} />}
        <Bubble m={item} />
      </View>
    );
  };

  const scrollToBottom = (animated = true) => {
    listRef.current?.scrollToOffset({ offset: 0, animated });
  };

  const onSend = () => {
    if (!value.trim()) return;
    setValue("");
    requestAnimationFrame(() => scrollToBottom());
  };

  useEffect(() => {
    if (kb > 0) {
      const t = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(t);
    }
  }, [kb]);

  const isOnline = chatMeta.status === "en línea";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <View
        className="px-3 py-2.5 flex-row items-center justify-between"
        style={{ borderBottomWidth: 1, borderBottomColor: C.ring }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="pr-2">
            <Feather name="chevron-left" size={26} color={C.icon} />
          </Pressable>
          <Image
            source={{ uri: chatMeta.avatar }}
            className="h-11 w-11 rounded-full mr-2"
            style={{ backgroundColor: C.pill }}
          />
          <View>
            <Text
              className="text-base font-semibold"
              style={{ color: C.text }}
            >
              {chatMeta.name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              {chatMeta.status !== "—" && (
                <View
                  className="h-2 w-2 rounded-full mr-1"
                  style={{
                    backgroundColor: isOnline ? "#22c55e" : C.iconMuted,
                  }}
                />
              )}
              <Text className="text-xs" style={{ color: C.sub }}>
                {chatMeta.status}
              </Text>
            </View>
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

      <FlatList
        ref={listRef}
        data={DATA}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        inverted
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: composerH + insets.bottom + 8,
        }}
        onContentSizeChange={() => scrollToBottom(false)}
      />

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
          disabled={!value.trim()}
          className="h-11 w-11 items-center justify-center ml-2 rounded-full"
          style={{ backgroundColor: value.trim() ? C.sendBtn : C.pill }}
        >
          <Feather
            name="send"
            size={18}
            color={value.trim() ? "#ffffff" : C.icon}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
