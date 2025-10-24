import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../../components/ui/button";
import { supabase } from "../../utils/supabase";

export default function ForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Correo requerido", "Por favor, ingresa tu correo.");
      return;
    }
    try {
      setLoading(true);
      // Envía OTP al correo
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: Linking.createURL("/auth/callback"),
        },
      });
      if (error) throw error;

      Alert.alert(
        "Código enviado",
        "Revisa tu correo y sigue las instrucciones.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert(
        "No se pudo enviar el código",
        err.message ?? "Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      className="flex-1 bg-white dark:bg-neutral-900"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Título superior */}
        <View className="mt-8 px-6">
          <Text className="text-5xl font-bold text-center text-neutral-900 dark:text-neutral-100">
            Forgot
          </Text>
        </View>

        {/* Ilustración */}
        <View className="items-center mt-4">
          <Image
            source={require("../../assets/images/Forgot.png")}
            className="w-[320px] h-[320px]"
            resizeMode="contain"
          />
        </View>

        {/* Título sección */}
        <View className="px-6 mt-2">
          <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Forgot Password
          </Text>
        </View>

        {/* Descripción */}
        <View className="px-6 mt-3">
          <Text className="text-xl leading-5 text-neutral-600 dark:text-neutral-300">
            Don’t worry it happens. Please enter the email address associated
            with your account
          </Text>
        </View>

        {/* Label */}
        <View className="px-6 mt-5">
          <Text className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
            Enter your Email address
          </Text>
        </View>

        {/* Input con icono */}
        <View className="px-6 mt-2">
          <View
            className="flex-row items-center rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3"
            style={Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 6,
              },
              android: { elevation: 2 },
            })}
          >
            <Feather name="mail" size={18} color="#6b7280" />
            <TextInput
              placeholder="correo_correo@exemple.com"
              placeholderTextColor={
                Platform.OS === "ios" ? "#9ca3af" : "#9ca3af"
              }
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              className="ml-3 flex-1 text-[15px] text-neutral-900 dark:text-neutral-100"
            />
          </View>
        </View>

        {/* Botón */}
        <View className="px-6 mt-6">
          <Button
            label={loading ? "Sending..." : "Get OTP"}
            variant="primary"
            onPress={onSendOtp}
            style={{ opacity: loading ? 0.7 : 1 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
