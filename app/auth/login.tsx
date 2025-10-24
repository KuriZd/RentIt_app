// app/auth/login.tsx
import { AntDesign, Feather } from "@expo/vector-icons";
import type { Provider } from "@supabase/supabase-js";
import { BlurView } from "expo-blur";
import Checkbox from "expo-checkbox";
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
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
} from "../../components";
import "../../global.css";
import { supabase } from "../../utils/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showHero = width >= 768; // md+

  // form state
  const [email, setEmail] = useState<string>("");
  const [pw, setPw] = useState<string>("");
  const [showPw, setShowPw] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(false);

  // cred loading flag
  const [credsLoaded, setCredsLoaded] = useState<boolean>(false);

  // loading flags
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // error messages
  const [errors, setErrors] = useState<{
    email: string;
    pw: string;
    general: string;
  }>({
    email: "",
    pw: "",
    general: "",
  });

  // spin animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // session check & listener
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) router.replace("/main");
      })
      .finally(() => setSessionLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) router.replace("/main");
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // load saved credentials
  useEffect(() => {
    (async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync("email");
        const savedPw = await SecureStore.getItemAsync("password");
        if (savedEmail && savedPw) {
          setEmail(savedEmail);
          setPw(savedPw);
          setRemember(true);
        }
      } catch (err) {
        console.warn("Error loading credentials:", err);
      } finally {
        setCredsLoaded(true);
      }
    })();
  }, []);

  // OAuth handler
  const handleOAuth = async (provider: Provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      Alert.alert(`${provider} Sign-In error`, error.message);
      return;
    }
    if (data?.url) await Linking.openURL(data.url);
  };

  // email/password login
  async function onLogin() {
    if (!credsLoaded) return;

    const newErr = { email: "", pw: "", general: "" };
    let hasError = false;
    if (!email) {
      newErr.email = "Ingresa tu email";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErr.email = "Dirección de email inválida";
      hasError = true;
    }
    if (!pw) {
      newErr.pw = "Ingresa tu contraseña";
      hasError = true;
    }
    setErrors(newErr);
    if (hasError) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });
    if (error) {
      setErrors({ ...newErr, general: error.message });
      setLoading(false);
    } else {
      try {
        if (remember) {
          await SecureStore.setItemAsync("email", email);
          await SecureStore.setItemAsync("password", pw);
        } else {
          await SecureStore.deleteItemAsync("email");
          await SecureStore.deleteItemAsync("password");
        }
      } catch (err) {
        console.warn("Error saving credentials:", err);
      }
    }
  }

  const keyboardOffset = Platform.select({ ios: 100, android: 80 });

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0b0b0c] dark:to-[#0f1115]">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardOffset}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} // centrado en mobile
          className="min-h-screen"
        >
          <View
            className={[
              "mx-auto w-full max-w-6xl px-5",
              showHero ? "py-16" : "py-24",
            ].join(" ")}
          >
            <View className="flex items-center justify-center flex-col-reverse md:grid md:grid-cols-2 gap-10">
              <AuthCard
                title="Welcome back"
                subtitle="Sign in to keep your numbers aligned with your goals."
              >
                {/* errores generales */}
                {!!errors.general && (
                  <View className="mb-4 px-3 py-2 bg-red-100 border border-red-400 rounded">
                    <Text className="text-red-700">{errors.general}</Text>
                  </View>
                )}

                {/* Email */}
                <View className="mb-3">
                  <Text className="mb-2 text-base font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </Text>
                  <View
                    className={[
                      "h-12 w-full flex-row items-center rounded-xl px-4",
                      errors.email
                        ? "border-2 border-red-500"
                        : "border border-zinc-300 dark:border-zinc-700",
                      "bg-white dark:bg-zinc-900",
                    ].join(" ")}
                  >
                    <AntDesign
                      name="mail"
                      size={18}
                      color="#71717A"
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      className="flex-1 text-base text-zinc-900 dark:text-white"
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {!!errors.email && (
                    <Text className="mt-1 text-sm text-red-600">
                      {errors.email}
                    </Text>
                  )}
                </View>

                {/* Password */}
                <View className="mb-2">
                  <Text className="mb-2 text-base font-medium text-zinc-700 dark:text-zinc-300">
                    Password
                  </Text>
                  <View className="h-12 w-full flex-row items-center rounded-xl px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <Feather
                      name="lock"
                      size={18}
                      color="#71717A"
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      className="flex-1 text-base text-zinc-900 dark:text-white"
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      value={pw}
                      onChangeText={setPw}
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <Pressable onPress={() => setShowPw((s) => !s)}>
                      <Feather
                        name={showPw ? "eye-off" : "eye"}
                        size={18}
                        color="#71717A"
                      />
                    </Pressable>
                  </View>
                  {!!errors.pw && (
                    <Text className="mt-1 text-sm text-red-600">
                      {errors.pw}
                    </Text>
                  )}
                </View>

                {/* Remember / Forgot */}
                <View className="mb-5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Checkbox
                      value={remember}
                      onValueChange={setRemember}
                      color={remember ? "#000" : undefined}
                    />
                    <Text className="text-sm text-zinc-700 dark:text-zinc-300">
                      Remember me
                    </Text>
                  </View>
                  <Link href="/auth/forgot" asChild>
                    <Pressable className="active:opacity-70">
                      <Text className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Forgot password?
                      </Text>
                    </Pressable>
                  </Link>
                </View>

                {/* Sign in */}
                <Button
                  onPress={onLogin}
                  className={loading ? "opacity-70" : ""}
                  disabled={loading}
                >
                  <Text className="font-medium text-white dark:text-zinc-900 text-lg">
                    {loading ? "Signing in..." : "Sign in"}
                  </Text>
                </Button>

                <Separator />

                {/* OAuth */}
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

                {/* Footer */}
                <View className="mt-8">
                  <Text className="text-center text-base text-zinc-700 dark:text-zinc-300">
                    Don’t have an account?{" "}
                    <Text
                      className="font-bold"
                      onPress={() => router.push("/auth/signup")}
                    >
                      Sign up
                    </Text>
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
      </KeyboardAvoidingView>

      {(sessionLoading || loading) && (
        <BlurView intensity={60} className="absolute inset-0">
          <View className="flex-1 justify-center items-center">
            <Animated.View
              style={{ transform: [{ rotate: spin }] }}
              className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent border-r-transparent rounded-full"
            />
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
}
