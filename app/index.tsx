import type { Provider } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthCard, Button, HeroPanel, OAuthButton, Separator } from "../components";
import "../global.css";
import { supabase } from "../utils/supabase";

export default function AuthScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showHero = width >= 768; // md+

  const handleOAuth = async (provider: Provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      Alert.alert(`${provider} Sign-In error`, error.message);
      return;
    }
    if (data?.url) await Linking.openURL(data.url);
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0b0b0c] dark:to-[#0f1115]">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center", // centra verticalmente en mobile
        }}
        className="min-h-screen"
      >
        <View
          className={[
            "mx-auto w-full max-w-6xl px-5",
            showHero ? "py-16" : "py-24", // más aire en mobile
          ].join(" ")}
        >
          <View
            className={[
              "flex items-center justify-center",
              "flex-col-reverse md:grid md:grid-cols-2 gap-10",
            ].join(" ")}
          >
            <AuthCard
              title="Ledgerly"
              subtitle="Success starts with financial sense, because every number leads to progress, and every progress leads to goals."
            >
              <View className="gap-4">
                <Button onPress={() => router.push("/auth/login")}>
                  <Text className="font-medium text-white dark:text-zinc-900 text-lg">
                    Sign inn
                  </Text>
                </Button>
                <Button variant="outline" onPress={() => router.push("/auth/signup")}>
                  <Text className="font-medium text-zinc-900 dark:text-zinc-100 text-lg">
                    Sign up
                  </Text>
                </Button>
              </View>

              <Separator />

              <View className="gap-3">
                <OAuthButton label="Continuar con Google" provider="google" onPress={handleOAuth} />
                <OAuthButton label="Continuar con Apple" provider="apple" onPress={handleOAuth} />
              </View>

              <View className="mt-8">
                <Text className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  Al continuar aceptas nuestros <Text className="font-semibold">Términos</Text> y la{" "}
                  <Text className="font-semibold">Política de privacidad</Text>.
                </Text>
              </View>
            </AuthCard>

            {showHero && (
              <HeroPanel
                headline="Make money make sense."
                copy="Track habits, visualize trends, and stay on top of your goals with a clean, focused interface."
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
