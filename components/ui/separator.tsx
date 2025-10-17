import React from "react";
import { Text, View } from "react-native";

export default function Separator({ label = "or" }: { label?: string }) {
  return (
    <View className="my-6 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800/80" />
      <Text className="text-base text-zinc-500 dark:text-zinc-400">{label}</Text>
      <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800/80" />
    </View>
  );
}
