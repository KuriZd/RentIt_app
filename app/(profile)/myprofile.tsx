// app/mysettings/profile.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

/* ---------------- Tipos ---------------- */
type Address = {
  street?: string | null;
  neighborhood?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
};

type Profile = {
  name?: string | null;
  avatar?: string | null;
  curp?: string | null;
  gender?: string | null;
  marital?: string | null;
  email?: string | null;
  medicalId?: string | null;
  address: Address;
};

/* ---------------- UI helpers ---------------- */
type SectionCardProps = { children: React.ReactNode; onEdit?: () => void };
function SectionCard({ children, onEdit }: SectionCardProps) {
  const scheme = useColorScheme();
  const iconColor = scheme === "dark" ? "#E5E7EB" : "#111827";
  return (
    <View className="relative mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {onEdit && (
        <Pressable
          onPress={onEdit}
          className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-800"
          accessibilityLabel="Editar sección"
        >
          <Feather name="edit-3" size={22} color={iconColor} />
        </Pressable>
      )}
      {children}
    </View>
  );
}

type FieldProps = { label: string; value?: string | null };
function Field({ label, value }: FieldProps) {
  return (
    <View className="mb-3">
      <Text className="text-lg leading-6 text-zinc-900 dark:text-zinc-100">
        <Text className="font-semibold">{label}: </Text>
        {value && String(value).trim().length > 0 ? value : "—"}
      </Text>
      <View className="mt-2 h-px bg-zinc-100 dark:bg-zinc-800/80" />
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga de perfil desde 'perfiles'
  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      try {
        setLoading(true);

        const { data: s } = await supabase.auth.getSession();
        const user = s.session?.user;
        if (!user) {
          router.replace("/auth/login");
          return;
        }

        // ⚠️ Consulta a la tabla 'perfiles'
        // columnas ejemplo: id (uuid FK a auth.users), nombre, avatar_url, curp, genero, estado_civil,
        // email, numero_medico, direccion (jsonb con { calle, colonia, cp, municipio, estado, telefono })
        const { data, error } = await supabase
          .from("perfiles")
          .select(
            "nombre, avatar_url, curp, genero, estado_civil, email, numero_medico, direccion"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!alive) return;

        if (!data) {
          // No existe fila para este usuario
          setProfile(null);
          return;
        }

        const dir = (data as any).direccion ?? {};
        const p: Profile = {
          name: (data as any).nombre ?? null,
          avatar: (data as any).avatar_url ?? null,
          curp: (data as any).curp ?? null,
          gender: (data as any).genero ?? null,
          marital: (data as any).estado_civil ?? null,
          email: (data as any).email ?? null,
          medicalId: (data as any).numero_medico ?? null,
          address: {
            street: dir.calle ?? null,
            neighborhood: dir.colonia ?? null,
            postalCode: dir.cp ?? null,
            city: dir.municipio ?? null,
            state: dir.estado ?? null,
            phone: dir.telefono ?? null,
          },
        };

        setProfile(p);
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "No se pudo cargar tu perfil.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator
          size="large"
          color={scheme === "dark" ? "#E5E7EB" : "#000"}
        />
      </SafeAreaView>
    );
  }

  const user = profile;
  const avatarUri =
    user?.avatar ||
    "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0";

  const backIconColor = scheme === "dark" ? "#E5E7EB" : "#111827";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 20,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          {/* <Pressable
            onPress={() => router.back()}
            className="mr-4 rounded-full p-2 active:bg-zinc-100 dark:active:bg-zinc-800"
            accessibilityLabel="Atrás"
          >
            <Feather name="arrow-left" size={24} color={backIconColor} />
          </Pressable> */}
          <Text className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Perfil
          </Text>
        </View>

        {/* Datos personales */}
        <SectionCard onEdit={() => router.push("/editprofile" as const)}>
          <View className="mb-6 items-center">
            <Image
              source={{ uri: avatarUri }}
              className="h-48 w-48 rounded-full"
            />
            <View className="mt-3 h-1 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </View>
          <Field label="Name" value={user?.name} />
          <Field label="CURP" value={user?.curp} />
          <Field label="Gender" value={user?.gender} />
          <Field label="Marital Status" value={user?.marital} />
          <Field label="Email Address" value={user?.email} />
          <Field label="N° de servicio médico" value={user?.medicalId} />
        </SectionCard>

        {/* Dirección */}
        <SectionCard onEdit={() => router.push("/" as const)}>
          <Field label="Calle y número" value={user?.address.street} />
          <Field label="Colonia" value={user?.address.neighborhood} />
          <Field label="Código postal" value={user?.address.postalCode} />
          <Field label="Municipio" value={user?.address.city} />
          <Field label="Estado" value={user?.address.state} />
          <Field label="Teléfono" value={user?.address.phone} />
        </SectionCard>

        {/* Placeholder */}
        {!user && (
          <View className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-zinc-700 dark:text-zinc-300">
              No encontramos información de tu perfil.
            </Text>
            <Pressable
              onPress={() => router.push("/editprofile" as const)}
              className="mt-4 h-11 items-center justify-center rounded-xl bg-blue-600 active:bg-blue-700"
            >
              <Text className="text-white">Completar perfil</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
