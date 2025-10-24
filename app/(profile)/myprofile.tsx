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

/* ---------------- Tipos auxiliares ---------------- */
type Address = {
  street?: string | null;
  neighborhood?: string | null;
  postal_code?: string | null;
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
  address: {
    street?: string | null;
    neighborhood?: string | null;
    postalCode?: string | null;
    city?: string | null;
    state?: string | null;
    phone?: string | null;
  };
};

type SectionCardProps = {
  children: React.ReactNode;
  onEdit?: () => void;
};

function SectionCard({ children, onEdit }: SectionCardProps) {
  const scheme = useColorScheme();
  const iconColor =
    scheme === "dark" ? "#E5E7EB" /* zinc-200 */ : "#111827"; /* gray-900 */

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

  // carga de perfil
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        const { data: sessionRes } = await supabase.auth.getSession();
        const session = sessionRes.session;
        if (!session?.user) {
          router.replace("/auth/login");
          return;
        }
        const userId = session.user.id;

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "full_name, avatar_url, curp, gender, marital, email, medical_id, address:address(street, neighborhood, postal_code, city, state, phone)"
          )
          .eq("id", userId)
          .single();

        if (error) {
          console.error(error);
          Alert.alert("Error", "No se pudo cargar tu perfil.");
          return;
        }
        if (!isMounted) return;

        const addr: Address | null = (data as any)?.address ?? null;
        setProfile({
          name: (data as any)?.full_name ?? null,
          avatar: (data as any)?.avatar_url ?? null,
          curp: (data as any)?.curp ?? null,
          gender: (data as any)?.gender ?? null,
          marital: (data as any)?.marital ?? null,
          email: (data as any)?.email ?? null,
          medicalId: (data as any)?.medical_id ?? null,
          address: {
            street: addr?.street ?? null,
            neighborhood: addr?.neighborhood ?? null,
            postalCode: addr?.postal_code ?? null,
            city: addr?.city ?? null,
            state: addr?.state ?? null,
            phone: addr?.phone ?? null,
          },
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
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
        {/* Header con flecha */}
        <View className="mb-6 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 rounded-full p-2 active:bg-zinc-100 dark:active:bg-zinc-800"
            accessibilityLabel="Atrás"
          >
            <Feather name="arrow-left" size={24} color={backIconColor} />
          </Pressable>
          <Text className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Mi Información
          </Text>
        </View>

        {/* Card datos personales */}
        <SectionCard onEdit={() => router.push("/editprofile" as const)}>
          <View className="mb-6 items-center">
            <Image
              source={{ uri: avatarUri }}
              className="h-48 w-48 rounded-full"
            />
            {/* anillo sutil según tema */}
            <View className="mt-3 h-1 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </View>
          <Field label="Name" value={user?.name} />
          <Field label="CURP" value={user?.curp} />
          <Field label="Gender" value={user?.gender} />
          <Field label="Marital Status" value={user?.marital} />
          <Field label="Email Address" value={user?.email} />
          <Field label="N° de servicio médico" value={user?.medicalId} />
        </SectionCard>

        {/* Card dirección */}
        <SectionCard onEdit={() => router.push("/" as const)}>
          <Field label="Calle y número" value={user?.address.street} />
          <Field label="Colonia" value={user?.address.neighborhood} />
          <Field label="Código postal" value={user?.address.postalCode} />
          <Field label="Municipio" value={user?.address.city} />
          <Field label="Estado" value={user?.address.state} />
          <Field label="Teléfono" value={user?.address.phone} />
        </SectionCard>

        {/* Empty/placeholder si no hay datos */}
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
