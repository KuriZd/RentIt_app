import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthSettingsScreen() {
  const [email, setEmail] = useState("");

  const onActivate = () => {
    console.log("Activate MFA with:", { email });
  };

  const Card = ({
    children,
    disabled,
    onPress,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onPress?: () => void;
  }) => (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={[
        "rounded-2xl border px-4 py-3 bg-white dark:bg-neutral-900",
        disabled ? "opacity-60" : "active:opacity-80",
        "border-neutral-200 dark:border-neutral-800",
        "flex-row items-center justify-between",
      ].join(" ")}
      style={Platform.select({
        ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
        android: { elevation: 2 },
      })}
    >
      {children}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
          {/* Title */}
          <View className="pt-2 mb-4">
            <Text className="text-[28px] font-bold text-neutral-900 dark:text-neutral-100">Authentication</Text>
          </View>

          {/* Intro / Help text */}
          <View>
            <Text className="text-[14px] leading-6 text-neutral-700 dark:text-neutral-300">
              Protect your account from unauthorized access by requiring a secure code when signing in.{" "}
              Have questions? Learn more about{" "}
              <Text
                className="text-sky-600 dark:text-sky-400 underline"
                onPress={() => {
                  // Abre documentación / web si quieres
                }}
              >
                multi-factor authentication
              </Text>
              .
            </Text>
          </View>

          {/* Section: MFA on all devices */}
          <View className="mt-7 mb-2">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              Multi-factor authentication on all devices
            </Text>
          </View>

          {/* Email input card */}
          <Card>
            <View className="flex-row items-center flex-1">
              <Feather name="mail" size={18} color="#6b7280" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="correo_correo@exemple.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                className="ml-3 flex-1 text-[15px] text-neutral-900 dark:text-neutral-100"
              />
            </View>
          </Card>

          {/* Section: options */}
          <View className="mt-8 mb-2">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              Multi-factor authentication options
            </Text>
          </View>

          {/* External Auth App (deshabilitada visualmente según mock) */}
          <Card disabled onPress={() => {}}>
            <View className="flex-row items-center flex-1">
              <Feather name="shield" size={18} color="#6b7280" />
              <Text className="ml-3 text-[15px] text-neutral-500 dark:text-neutral-400">
                External Authentication App
              </Text>
            </View>
            <Feather name="chevron-right" size={22} color={Platform.OS === "ios" ? "#8E8E93" : "#9ca3af"} />
          </Card>

          {/* Phone number (deshabilitada visualmente) */}
          <View className="mt-3">
            <Card disabled onPress={() => {}}>
              <View className="flex-row items-center flex-1">
                <Feather name="phone" size={18} color="#6b7280" />
                <Text className="ml-3 text-[15px] text-neutral-500 dark:text-neutral-400">Phone number</Text>
              </View>
              <Feather name="chevron-right" size={22} color={Platform.OS === "ios" ? "#8E8E93" : "#9ca3af"} />
            </Card>
          </View>

          {/* CTA */}
          <View className="mt-8">
            <Pressable
              onPress={onActivate}
              className="rounded-2xl bg-sky-600 active:opacity-90 px-5 py-3 items-center justify-center"
              style={Platform.select({
                ios: { shadowColor: "#0ea5e9", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
                android: { elevation: 2 },
              })}
            >
              <Text className="text-white text-[15px] font-semibold">ACTIVATE</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
