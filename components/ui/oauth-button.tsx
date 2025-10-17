import { AntDesign } from "@expo/vector-icons";
import type { Provider } from "@supabase/supabase-js";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  provider: Extract<Provider, "google" | "apple">;
  onPress: (provider: Provider) => void;
};

export default function OAuthButton({ label, provider, onPress }: Props) {
  const hover =
    Platform.OS === "web" ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/80" : "";
  const icon =
    provider === "google" ? (
      <AntDesign name="google" size={20} color="#DB4437" />
    ) : provider === "apple" ? (
      <AntDesign name="apple" size={20} color="#fff" />
    ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      className={[
        "h-12 w-full rounded-xl",
        "border border-zinc-300 dark:border-zinc-700/80",
        "bg-white/90 dark:bg-zinc-900/70",
        "backdrop-blur-sm",
        "items-center justify-center",
        "transition-all",
        hover,
      ].join(" ")}
      onPress={() => onPress(provider)}
    >
      <View className="flex-row items-center justify-center gap-3">
        {icon}
        <Text className="font-medium text-zinc-900 dark:text-zinc-100 text-base">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
