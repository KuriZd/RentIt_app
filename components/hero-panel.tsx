import React from "react";
import { Image, Text, View } from "react-native";

type Props = {
  headline: string;
  copy: string;
  imageUri?: string;
};

export default function HeroPanel({
  headline,
  copy,
  imageUri = "https://images.unsplash.com/photo-1553729784-e91953dec042?q=80&w=1470&auto=format&fit=crop",
}: Props) {
  return (
    <View className="w-full">
      <View
        className={[
          "relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden",
          "rounded-3xl border border-zinc-200/70 dark:border-zinc-800/60",
          "bg-gradient-to-br from-emerald-100 via-teal-100 to-sky-100",
          "dark:from-zinc-800 dark:via-zinc-900 dark:to-black",
          "shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)]",
        ].join(" ")}
        accessibilityRole="image"
        accessibilityLabel="Financial growth illustration"
      >
        <View className="absolute inset-0 opacity-70">
          <Image source={{ uri: imageUri }} className="h-full w-full" />
        </View>
        <View className="absolute inset-0 p-6 sm:p-8 md:p-10 justify-end bg-gradient-to-t from-black/30 to-transparent">
          <View className="max-w-md">
            <Text className="text-white text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              {headline}
            </Text>
            <Text className="mt-3 text-white/95 text-sm sm:text-base leading-6">
              {copy}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
