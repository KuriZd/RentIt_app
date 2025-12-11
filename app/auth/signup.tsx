// app/auth/signup.tsx
import { AntDesign, Feather } from "@expo/vector-icons";
import type { Provider } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

export default function SignupScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showHero = width >= 768;

  const [email, setEmail] = useState<string>("");
  const [pw, setPw] = useState<string>("");
  const [pw2, setPw2] = useState<string>("");
  const [showPw, setShowPw] = useState<boolean>(false);
  const [showPw2, setShowPw2] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const hasMinLen = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasSymbol = /\W/.test(pw);
  const pwMatch = pw2 === pw;

  const emailError =
    submitted && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Correo inválido"
      : "";
  const matchError =
    submitted && pw2 && !pwMatch ? "Las contraseñas no coinciden" : "";

  const canSubmit = useMemo(
    () =>
      Boolean(email) &&
      hasMinLen &&
      hasUpper &&
      hasSymbol &&
      pwMatch &&
      !loading,
    [email, hasMinLen, hasUpper, hasSymbol, pwMatch, loading]
  );

  const requirements = [
    { key: "length", label: "Mínimo 8 caracteres", valid: hasMinLen },
    { key: "upper", label: "Al menos 1 mayúscula", valid: hasUpper },
    { key: "symbol", label: "Al menos 1 símbolo", valid: hasSymbol },
  ] as const;

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
        Alert.alert("Error al iniciar con " + provider, error.message);
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
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error inesperado", "No se pudo iniciar sesión con OAuth.");
    }
  };

  const onSubmit = async () => {
    if (!canSubmit || loading) return;

    setSubmitted(true);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: pw,
      });

      if (error) {
        let msg = "Ocurrió un error al registrarte. Inténtalo de nuevo.";

        if (error.message.includes("already registered"))
          msg = "Este correo ya está registrado. Inicia sesión o usa otro.";
        else if (error.message.includes("Password"))
          msg = "La contraseña no cumple los requisitos mínimos.";

        Alert.alert("No se pudo completar el registro", msg);
        return;
      }

      await new Promise((r) => setTimeout(r, 400));

      setShowVerifyModal(true);
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Error inesperado",
        "Parece que hubo un problema con la conexión. Inténtalo más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const keyboardOffset = Platform.select({ ios: 100, android: 80 });

  const goToLogin = () => {
    setShowVerifyModal(false);
    router.replace("/auth/login");
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
          keyboardDismissMode="on-drag"
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
                title="Crea tu cuenta"
                subtitle="Regístrate para empezar a organizar tus finanzas y convertir tus metas en hábitos."
              >
                <View className="mb-4">
                  <Text className="mb-2 text-base font-medium text-zinc-700 dark:text-zinc-300">
                    Correo electrónico
                  </Text>
                  <View
                    className={[
                      "h-14 w-full flex-row items-center rounded-xl px-4",
                      emailError
                        ? "border-2 border-red-500"
                        : "border border-zinc-300 dark:border-zinc-700",
                      "bg-white dark:bg-zinc-900",
                    ].join(" ")}
                  >
                    <AntDesign
                      name="mail"
                      size={20}
                      color="#71717A"
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      className="flex-1 text-lg text-zinc-900 dark:text-white"
                      placeholder="correo@ejemplo.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {!!emailError && (
                    <Text className="mt-1 text-sm text-red-600">
                      {emailError}
                    </Text>
                  )}
                </View>

                <View className="mb-3">
                  <Text className="mb-2 text-base font-medium text-zinc-700 dark:text-zinc-300">
                    Contraseña
                  </Text>
                  <View className="h-14 w-full flex-row items-center rounded-xl px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <Feather
                      name="lock"
                      size={20}
                      color="#71717A"
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      className="flex-1 text-lg text-zinc-900 dark:text-white"
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      value={pw}
                      onChangeText={setPw}
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                      autoComplete="password-new"
                    />
                    <Pressable onPress={() => setShowPw((s) => !s)}>
                      <Feather
                        name={showPw ? "eye-off" : "eye"}
                        size={20}
                        color="#71717A"
                      />
                    </Pressable>
                  </View>
                </View>

                {(submitted || pw.length > 0) && (
                  <View className="mb-4 space-y-2">
                    {requirements.map(({ key, label, valid }) => (
                      <View
                        key={key}
                        className="flex-row items-center"
                        style={{ gap: 10 }}
                      >
                        <View
                          className={`h-5 w-5 rounded-full ${valid ? "bg-emerald-500" : "bg-red-500"
                            }`}
                        />
                        <Text
                          className={`text-sm ${valid
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-red-700 dark:text-red-400"
                            }`}
                        >
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View className="mb-2">
                  <Text className="mb-2 text-base font-medium text-zinc-700 dark:text-zinc-300">
                    Repetir contraseña
                  </Text>
                  <View
                    className={[
                      "h-14 w-full flex-row items-center rounded-xl px-4",
                      submitted && !pwMatch
                        ? "border-2 border-red-500"
                        : "border border-zinc-300 dark:border-zinc-700",
                      "bg-white dark:bg-zinc-900",
                    ].join(" ")}
                  >
                    <Feather
                      name="lock"
                      size={20}
                      color="#71717A"
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      className="flex-1 text-lg text-zinc-900 dark:text-white"
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      value={pw2}
                      onChangeText={setPw2}
                      secureTextEntry={!showPw2}
                      autoCapitalize="none"
                      autoComplete="password-new"
                    />
                    <Pressable onPress={() => setShowPw2((s) => !s)}>
                      <Feather
                        name={showPw2 ? "eye-off" : "eye"}
                        size={20}
                        color="#71717A"
                      />
                    </Pressable>
                  </View>
                  {submitted && matchError && (
                    <Text className="mt-1 text-sm text-red-600">
                      {matchError}
                    </Text>
                  )}
                </View>

                <View className="mt-4">
                  <Button
                    onPress={onSubmit}
                    className={!canSubmit ? "opacity-70" : ""}
                    disabled={!canSubmit}
                  >
                    <Text className="font-medium text-white dark:text-zinc-900 text-lg">
                      {loading ? "Registrando..." : "Sign up"}
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

                <View className="mt-6">
                  <Text className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    By registering, you agree to the{" "}
                    <Text className="font-semibold">Terms</Text> and{" "}
                    <Text className="font-semibold">Privacy Policy</Text>.
                  </Text>
                  <Pressable
                    className="mt-3"
                    onPress={() => router.push("/auth/login")}
                  >
                    <Text className="text-center text-sm text-zinc-700 dark:text-zinc-300">
                      Already have an account?{" "}
                      <Text className="font-semibold">Log in</Text>
                    </Text>
                  </Pressable>
                </View>
              </AuthCard>

              {showHero && (
                <HeroPanel
                  headline="Start strong with clarity."
                  copy="Create your account and turn your numbers into decisions that move you forward."
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={goToLogin}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <View className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 px-6 py-6">
            <View className="items-center mb-4">
              <View className="h-12 w-12 rounded-full items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 mb-3">
                <Feather name="mail" size={26} color="#16a34a" />
              </View>
              <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 text-center">
                ¡Registro exitoso!
              </Text>
              <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                Te enviamos un enlace de verificación a{" "}
                <Text className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {email || "tu correo"}
                </Text>
                . {"\n"}
                Confirma tu cuenta desde tu correo y luego inicia sesión para
                continuar.
              </Text>
            </View>

            <View className="mt-4 space-y-3">
              <Pressable
                onPress={goToLogin}
                className="h-11 items-center justify-center rounded-xl bg-emerald-600"
              >
                <Text className="text-sm font-semibold text-white">
                  Ir al inicio de sesión
                </Text>
              </Pressable>

              <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                Si no ves el correo en unos minutos, revisa también tu carpeta
                de spam o promociones.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
