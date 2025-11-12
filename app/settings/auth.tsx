import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type Factor = {
  id: string;
  type: "totp" | "webauthn" | "phone" | string;
  friendly_name?: string | null;
  created_at?: string | null;
};

export default function AuthSettingsScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [otpUri, setOtpUri] = useState<string | null>(null);
  const [otpSecret, setOtpSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const hasTotp = useMemo(
    () => factors.some((f) => f.type === "totp"),
    [factors]
  );

  // 📨 Obtener correo del usuario autenticado y factores MFA
  const fetchUserAndFactors = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.email) setEmail(userData.user.email);

    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return;
    const all = (data?.all ?? []) as any[];
    const verified = all
      .filter((f) => f.status === "verified")
      .map((f) => ({
        id: f.id,
        type: (f.factor_type ?? f.type) as Factor["type"],
        friendly_name: f.friendly_name ?? null,
        created_at: f.created_at ?? null,
      })) as Factor[];
    setFactors(verified);
  };

  useEffect(() => {
    fetchUserAndFactors();
  }, []);

  /* ===============================
     🔐 ACTIVAR MFA (Enroll TOTP)
     =============================== */
  const onActivate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      setFactorId(data?.id ?? null);
      setOtpUri(data?.totp?.uri ?? null);
      setOtpSecret(data?.totp?.secret ?? null);
      setEnrolling(true);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     ✅ VERIFICAR MFA (Challenge + Verify TOTP)
     ========================================= */
  const onVerify = async () => {
    if (!factorId || !code) return;
    try {
      setLoading(true);
      const { data: challenge, error: chErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (chErr) {
        Alert.alert("Error", chErr.message);
        return;
      }
      const challengeId = challenge?.id;
      if (!challengeId) {
        Alert.alert("Error", "No challenge available for verification.");
        return;
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (error) {
        Alert.alert(
          "Código inválido",
          "Verifica el código de 6 dígitos e inténtalo de nuevo."
        );
        return;
      }
      setEnrolling(false);
      setCode("");
      setOtpUri(null);
      setOtpSecret(null);
      setFactorId(null);
      await fetchUserAndFactors();
      Alert.alert("Listo", "Autenticación en dos pasos activada.");
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     ❌ DESACTIVAR MFA (Unenroll)
     ============================== */
  const onDisable = async () => {
    const totp = factors.find((f) => f.type === "totp");
    if (!totp) return;
    Alert.alert(
      "Desactivar MFA",
      "¿Deseas desactivar la autenticación en dos pasos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase.auth.mfa.unenroll({
                factorId: totp.id,
              });
              if (error) {
                Alert.alert("Error", error.message);
                return;
              }
              await fetchUserAndFactors();
              Alert.alert("Hecho", "MFA desactivada.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 🔧 Card solo presionable si tiene onPress (evita cerrar teclado)
  const Card = ({
    children,
    disabled,
    onPress,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onPress?: () => void;
  }) => {
    const Base: any = onPress ? Pressable : View;
    return (
      <Base
        disabled={disabled}
        onPress={onPress}
        className={[
          "rounded-2xl border px-4 py-3 bg-white dark:bg-neutral-900",
          disabled ? "opacity-60" : onPress ? "active:opacity-80" : "",
          "border-neutral-200 dark:border-neutral-800",
          "flex-row items-center justify-between",
        ].join(" ")}
        style={Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          },
          android: { elevation: 2 },
        })}
      >
        {children}
      </Base>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      {/* ⚙️ Ajustes teclado y scroll */}
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "height" })}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="always"
        >
          <View className="pt-2 mb-4">
            <Text className="text-[28px] font-bold text-neutral-900 dark:text-neutral-100 ml-12">
              Authentication
            </Text>
          </View>

          <View>
            <Text className="text-[14px] leading-6 text-neutral-700 dark:text-neutral-300 mt-8">
              Protect your account from unauthorized access by requiring a
              secure code when signing in. Learn more about{" "}
              <Text className="text-sky-600 dark:text-sky-400 underline">
                multi-factor authentication
              </Text>
              .
            </Text>
          </View>

          <View className="mt-7 mb-2">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              Multi-factor authentication on all devices
            </Text>
          </View>

          {/* 📨 Email: se obtiene del usuario actual */}
          <Card>
            <View className="flex-row items-center flex-1">
              <Feather name="mail" size={18} color="#6b7280" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // <- sólo lectura
                className="ml-3 flex-1 text-[15px] text-neutral-900 dark:text-neutral-100 opacity-80"
              />
            </View>
          </Card>

          <View className="mt-8 mb-2">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              Multi-factor authentication options
            </Text>
          </View>

          <Card disabled>
            <View className="flex-row items-center flex-1">
              <Feather name="shield" size={18} color="#6b7280" />
              <Text className="ml-3 text-[15px] text-neutral-500 dark:text-neutral-400">
                External Authentication App
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={22}
              color={Platform.OS === "ios" ? "#8E8E93" : "#9ca3af"}
            />
          </Card>

          <View className="mt-3">
            <Card disabled>
              <View className="flex-row items-center flex-1">
                <Feather name="phone" size={18} color="#6b7280" />
                <Text className="ml-3 text-[15px] text-neutral-500 dark:text-neutral-400">
                  Phone number
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={22}
                color={Platform.OS === "ios" ? "#8E8E93" : "#9ca3af"}
              />
            </Card>
          </View>

          {/* CTA activar/desactivar MFA */}
          <View className="mt-8">
            <Pressable
              onPress={hasTotp ? onDisable : onActivate}
              disabled={loading}
              className={[
                "rounded-2xl px-5 py-3 items-center justify-center",
                hasTotp ? "bg-rose-600" : "bg-sky-600",
                loading ? "opacity-70" : "",
              ].join(" ")}
              style={Platform.select({
                ios: {
                  shadowColor: hasTotp ? "#e11d48" : "#0ea5e9",
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                },
                android: { elevation: 2 },
              })}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-[15px] font-semibold">
                  {hasTotp ? "DISABLE MFA" : "ACTIVATE"}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔲 Modal para verificar QR y código */}
      <Modal visible={enrolling} transparent animationType="slide">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full rounded-2xl bg-white dark:bg-neutral-900 p-5">
            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Scan QR and verify
            </Text>

            <View className="items-center mb-4">
              {otpUri ? (
                <QRCode value={otpUri} size={220} />
              ) : (
                <ActivityIndicator />
              )}
            </View>

            {otpSecret ? (
              <Text className="text-xs text-center text-neutral-600 dark:text-neutral-300 mb-4">
                Secret: {otpSecret}
              </Text>
            ) : null}

            <View className="mb-3 flex-row items-center rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 h-12">
              <Feather name="key" size={18} color="#6b7280" />
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={6}
                className="ml-3 flex-1 text-[16px] text-neutral-900 dark:text-neutral-100"
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setEnrolling(false);
                  setCode("");
                  setOtpUri(null);
                  setOtpSecret(null);
                  setFactorId(null);
                }}
                className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 h-12 items-center justify-center"
              >
                <Text className="text-neutral-800 dark:text-neutral-100">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={onVerify}
                disabled={loading || code.length < 6}
                className={[
                  "flex-1 rounded-xl h-12 items-center justify-center",
                  loading || code.length < 6 ? "bg-sky-400/60" : "bg-sky-600",
                ].join(" ")}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Verify</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
