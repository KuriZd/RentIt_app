import React from "react";
import { Image, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <View
      className={[
        "w-full",
        "rounded-3xl border",
        "border-zinc-200/70 dark:border-zinc-800/70",
        "bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl",
        "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
        "p-6 sm:p-8 md:p-10",
      ].join(" ")}
    >
      <View className="gap-6">
        <View className="flex-row items-center gap-4">
          <Image
            source={{
              uri:
                "https://plus.unsplash.com/premium_photo-1661914978519-52a11fe159a7?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0",
            }}
            accessibilityLabel="Ledgerly logo"
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl"
          />
          <Text className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </Text>
        </View>
        <Text className="text-zinc-600 dark:text-zinc-300 text-base sm:text-lg leading-6 sm:leading-7 md:max-w-[45ch] text-justify">
          {subtitle}
        </Text>
      </View>
      <View className="mt-8 sm:mt-10">{children}</View>
    </View>
  );
}
