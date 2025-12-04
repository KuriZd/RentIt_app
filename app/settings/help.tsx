// app/settings/help.tsx
import { supabase } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HelpItem = { title: string; description: string };

const ITEMS: HelpItem[] = [
  {
    title: "Forgot Username",
    description:
      "If you forgot your username, open the login screen and select 'Forgot Username'. You will receive an email with your account information.",
  },
  {
    title: "Forgot Password",
    description:
      "To reset your password, go to the login page and tap 'Forgot Password'. Follow the instructions in the email sent to your account.",
  },
  {
    title: "Request Account Data",
    description:
      "You can request all data associated with your account by contacting support. We’ll send you a report within 30 days.",
  },
  {
    title: "Resolve Chargebacks",
    description:
      "If you received a chargeback, contact billing and provide your transaction ID to start the review process.",
  },
  {
    title: "Account Deletion",
    description:
      "To permanently delete your account, go to Settings > Delete Account. This action cannot be undone.",
  },
];

// UID fijo del administrador
const ADMIN_ID = "8f730f62-8072-452b-b5c3-26a4ae81be72";

function buildRoomId(a: string, b: string) {
  return [a, b].sort().join(":");
}

export default function HelpScreen() {
  const [selected, setSelected] = useState<HelpItem | null>(null);
  const router = useRouter();

  const cardShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
  });

  const handleContactAdmin = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para contactar al administrador."
        );
        return;
      }

      const myId = data.user.id;
      const roomId = buildRoomId(myId, ADMIN_ID);

      router.push({
        pathname: "/messages/[id]",
        params: { id: roomId },
      });
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Error",
        "No se pudo abrir el chat con el administrador. Intenta de nuevo."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950 ">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="pt-3 mb-4">
          <Text className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 ml-12">
            {selected ? "Help Detail" : "Help"}
          </Text>
          {!selected && (
            <Text className="mt-6 text-xl leading-6 text-neutral-600 dark:text-neutral-400">
              Select a topic to learn more or resolve your issue.
            </Text>
          )}
        </View>

        {/* Call to action: contactar admin */}
        <View className="mb-4">
          <Pressable
            onPress={handleContactAdmin}
            android_ripple={{
              color:
                Platform.OS === "android"
                  ? "rgba(255,255,255,0.06)"
                  : undefined,
            }}
            className="flex-row items-center rounded-2xl bg-indigo-50 dark:bg-neutral-900 px-4 py-4"
            style={cardShadow}
          >
            <View className="h-10 w-10 rounded-full items-center justify-center bg-indigo-100 dark:bg-neutral-800">
              <Feather name="message-circle" size={20} color="#4f46e5" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100">
                Contactar al administrador
              </Text>
              <Text className="mt-1 text-[13px] text-neutral-700 dark:text-neutral-300">
                Si aún necesitas ayuda, envía un mensaje directo al
                administrador para recibir soporte personalizado.
              </Text>
            </View>
          </Pressable>
        </View>

        {/* List / Detail */}
        {!selected ? (
          <View className="gap-3">
            {ITEMS.map((it) => (
              <Pressable
                key={it.title}
                onPress={() => setSelected(it)}
                android_ripple={{
                  color:
                    Platform.OS === "android"
                      ? "rgba(255,255,255,0.06)"
                      : undefined,
                }}
                className="flex-row items-center justify-between rounded-2xl bg-white dark:bg-neutral-900 px-4 py-4"
                style={cardShadow}
              >
                <Text className="text-[16px] text-neutral-900 dark:text-neutral-100">
                  {it.title}
                </Text>
                <Feather
                  name="chevron-right"
                  size={22}
                  color={Platform.OS === "ios" ? "#8E8E93" : "#6b7280"}
                />
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="mt-2">
            <Pressable
              onPress={() => setSelected(null)}
              className="flex-row items-center mb-4 active:opacity-70"
            >
              <Feather
                name="chevron-left"
                size={22}
                color={Platform.OS === "ios" ? "#8E8E93" : "#6b7280"}
              />
              <Text className="ml-1 text-[15px] text-neutral-600 dark:text-neutral-400">
                Back to Help
              </Text>
            </Pressable>

            <Text className="text-[22px] font-semibold text-neutral-900 dark:text-neutral-100">
              {selected.title}
            </Text>
            <Text className="mt-3 text-[15px] leading-7 text-neutral-700 dark:text-neutral-300">
              {selected.description}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
