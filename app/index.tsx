// app/auth/index.tsx o donde lo tengas ubicado
import type { Provider } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Alert,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AuthCard,
  Button,
  HeroPanel,
  OAuthButton,
  Separator,
} from "../components";
import "../global.css";
import { supabase } from "../utils/supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;

  if (!access_token || !refresh_token) return;

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
};

export default function AuthScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showHero = width >= 768;

  const handleOAuth = async (provider: Provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert(`${provider} Sign-In error`, error.message);
        return;
      }

      if (!data?.url) return;

      const res = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (res.type === "success" && res.url) {
        await createSessionFromUrl(res.url);
      }
    } catch (e: any) {
      Alert.alert("OAuth error", e?.message ?? "No se pudo iniciar con OAuth.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0b0b0c] dark:to-[#0f1115]">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
        }}
        className="min-h-screen"
      >
        <View
          className={[
            "mx-auto w-full max-w-6xl px-5",
            showHero ? "py-16" : "py-24",
          ].join(" ")}
        >
          <View
            className={[
              "flex items-center justify-center",
              "flex-col-reverse md:grid md:grid-cols-2 gap-10",
            ].join(" ")}
          >
            <AuthCard
              title="Rent-It"
              subtitle="Success starts with financial sense, because every number leads to progress, and every progress leads to goals."
            >
              <View className="gap-4">
                <Button onPress={() => router.push("/auth/login")}>
                  <Text className="font-medium text-white dark:text-zinc-900 text-lg">
                    Sign in
                  </Text>
                </Button>
                <Button
                  variant="outline"
                  onPress={() => router.push("/auth/signup")}
                >
                  <Text className="font-medium text-zinc-900 dark:text-zinc-100 text-lg">
                    Sign up
                  </Text>
                </Button>
              </View>

              <Separator />

              <View className="gap-3">
                <OAuthButton
                  label="Continuar con Google"
                  provider="google"
                  onPress={handleOAuth}
                />
                <OAuthButton
                  label="Continuar con Apple"
                  provider="apple"
                  onPress={handleOAuth}
                />
              </View>

              <View className="mt-8">
                <Text className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  Al continuar aceptas nuestros{" "}
                  <Text className="font-semibold">Términos</Text> y la{" "}
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
