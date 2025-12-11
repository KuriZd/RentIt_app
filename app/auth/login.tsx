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
  Modal,
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
  const showHero = width >= 768;

  const [email, setEmail] = useState<string>("");
  const [pw, setPw] = useState<string>("");
  const [showPw, setShowPw] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(false);

  const [credsLoaded, setCredsLoaded] = useState<boolean>(false);

  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState<{
    email: string;
    pw: string;
    general: string;
  }>({
    email: "",
    pw: "",
    general: "",
  });

  const [showProfileModal, setShowProfileModal] = useState(false);

  const handledSessionRef = useRef(false);

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

  const routeAfterLogin = async (userId: string) => {
    if (handledSessionRef.current) return;
    handledSessionRef.current = true;

    try {
      const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("nombre, fecha_nacimiento, direccion")
        .eq("id", userId)
        .maybeSingle();

      if (perfilError) {
        console.error("Error cargando perfil:", perfilError);
        router.replace("/main");
        return;
      }

      const dir = (perfil as any)?.direccion ?? {};
      const perfilIncompleto =
        !perfil ||
        !perfil.nombre ||
        !perfil.fecha_nacimiento ||
        !dir.calle ||
        !dir.municipio ||
        !dir.estado;

      if (perfilIncompleto) {
        setShowProfileModal(true);
      } else {
        router.replace("/main");
      }
    } catch (e) {
      console.error("Error en routeAfterLogin:", e);
      router.replace("/main");
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          routeAfterLogin(session.user.id);
        } else {
          setSessionLoading(false);
        }
      })
      .catch((e) => {
        console.error("Error getSession:", e);
        setSessionLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          routeAfterLogin(session.user.id);
        } else {
          setSessionLoading(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

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

  const handleOAuth = async (provider: Provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      Alert.alert(`${provider} Sign-In error`, error.message);
      return;
    }
    if (data?.url) await Linking.openURL(data.url);
  };

  async function onLogin() {
    if (!credsLoaded || loading) return;

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
      } finally {
        setLoading(false);
      }
    }
  }

  const keyboardOffset = Platform.select({ ios: 100, android: 80 });

  const handleProfileLater = () => {
    setShowProfileModal(false);
    router.replace("/main");
  };

  const handleProfileNow = () => {
    setShowProfileModal(false);
    router.replace("/(profile)/editprofile?onboarding=1");
  };

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
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
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
                {!!errors.general && (
                  <View className="mb-4 px-3 py-2 bg-red-100 border border-red-400 rounded">
                    <Text className="text-red-700">{errors.general}</Text>
                  </View>
                )}

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

      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleProfileLater}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <View className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 px-6 py-6">
            <View className="items-center mb-4">
              <View className="h-12 w-12 rounded-full items-center justify-center bg-blue-100 dark:bg-blue-900/40 mb-3">
                <Feather name="user-check" size={26} color="#2563eb" />
              </View>
              <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 text-center">
                Completa tu perfil
              </Text>
              <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                Para usar RentIt y publicar artículos necesitamos algunos datos
                básicos como tu nombre y dirección.
              </Text>
            </View>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={handleProfileLater}
                className="flex-1 h-11 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700"
              >
                <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-100">
                  Más tarde
                </Text>
              </Pressable>
              <Pressable
                onPress={handleProfileNow}
                className="flex-1 h-11 items-center justify-center rounded-xl bg-blue-600"
              >
                <Text className="text-sm font-semibold text-white">
                  Completar ahora
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

