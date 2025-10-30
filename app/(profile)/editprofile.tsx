// app/profile/edit.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------- Tipos ---------------- */
type SelectItem = { label: string; value: string };

type SelectProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  items: SelectItem[];
  onChange?: (val: string) => void;
};

type FieldProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad"
    | "decimal-pad";
};

/* ---------------- Select con Modal y paleta COLORS ---------------- */
function Select({ label, value, placeholder = "Select…", items, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
      card: isDark ? "#0b0b0c" : "#ffffff",
      inputBg: isDark ? "#0b0b0c" : "#ffffff",
      text: isDark ? "#fafafa" : "#111827",
      subtext: isDark ? "#a1a1aa" : "#52525b",
      divider: isDark ? "#27272a" : "#e5e7eb",
    }),
    [isDark]
  );

  const shadow = Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 2 },
    default: {},
  });

  return (
    <View className="mb-4">
      {!!label && (
        <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
      )}

      <Pressable
        className="h-12 flex-row items-center justify-between rounded-xl px-3"
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label || "Abrir selector"}
        style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.ring, borderWidth: 1 }}
      >
        <Text
          className="text-base"
          style={{ color: value ? COLORS.text : COLORS.iconMuted }}
        >
          {value ? (items.find((i) => i.value === value)?.label ?? value) : placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={COLORS.iconMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* overlay */}
        <Pressable className="flex-1" onPress={() => setOpen(false)} style={{ backgroundColor: COLORS.overlay }} />
        {/* card */}
        <View
          className="absolute left-4 right-4 top-1/4 rounded-2xl p-3"
          style={[{ backgroundColor: COLORS.card }, shadow]}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-base font-semibold" style={{ color: COLORS.text }}>
              {label || "Select"}
            </Text>
            <Pressable className="p-2 -mr-2" onPress={() => setOpen(false)}>
              <Feather name="x" size={20} color={COLORS.iconMuted} />
            </Pressable>
          </View>

          <FlatList
            data={items}
            keyExtractor={(it, idx) => String(it?.value ?? idx)}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.divider }} />}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => {
              const selected = value === item.value;
              return (
                <Pressable
                  className="px-3 py-3"
                  onPress={() => {
                    onChange?.(item.value);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  android_ripple={{ color: isDark ? "#27272a" : "#f3f4f6" }}
                >
                  <Text
                    className="text-base"
                    style={{ color: selected ? "#2563eb" : COLORS.text, fontWeight: selected ? "600" : "400" }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- Input reutilizable (usa COLORS) ---------------- */
function Field({ label, placeholder, value, onChangeText, keyboardType = "default" }: FieldProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const COLORS = useMemo(
    () => ({
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      inputBg: isDark ? "#0b0b0c" : "#ffffff",
      text: isDark ? "#fafafa" : "#111827",
      placeholder: "#9CA3AF",
    }),
    [isDark]
  );

  return (
    <View className="mb-4">
      {!!label && (
        <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
      )}
      <TextInput
        className="h-12 rounded-xl px-3 text-base"
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.ring, borderWidth: 1, color: COLORS.text }}
      />
    </View>
  );
}

/* ---------------- Pantalla ---------------- */
export default function ProfileEditScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const COLORS = useMemo(
    () => ({
      text: isDark ? "#fafafa" : "#111827",
      subtext: isDark ? "#a1a1aa" : "#52525b",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      dashed: isDark ? "#3f3f46" : "#d4d4d8",
    }),
    [isDark]
  );

  const [avatarUri, setAvatarUri] = useState(
    "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0"
  );

  // Estados del formulario
  const [fullname, setFullname] = useState("");
  const [curp, setCurp] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [colonia, setColonia] = useState("");
  const [zip, setZip] = useState("");
  const [town, setTown] = useState("");
  const [township, setTownship] = useState("");
  const [phone, setPhone] = useState("");
  const [stature, setStature] = useState("");
  const [weight, setWeight] = useState("");

  // Fecha de nacimiento
  const now = new Date();
  const years = useMemo<SelectItem[]>(() => {
    const arr: SelectItem[] = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 100; y--) {
      arr.push({ label: String(y), value: String(y) });
    }
    return arr;
  }, []);
  const months = useMemo<SelectItem[]>(
    () =>
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
        (m, i) => ({ label: m, value: String(i + 1).padStart(2, "0") })
      ),
    []
  );
  const days = useMemo<SelectItem[]>(
    () => Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1).padStart(2, "0") })),
    []
  );
  const [dDay, setDDay] = useState("");
  const [dMonth, setDMonth] = useState("");
  const [dYear, setDYear] = useState("");

  const maritalOptions: SelectItem[] = [
    { label: "Soltero(a)", value: "single" },
    { label: "Casado(a)", value: "married" },
    { label: "Divorciado(a)", value: "divorced" },
    { label: "Viudo(a)", value: "widowed" },
    { label: "Unión libre", value: "cohabiting" },
  ];
  const [marital, setMarital] = useState("");

  // Helpers
  const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");

  function onSave() {
    const errs: string[] = [];
    if (!fullname.trim()) errs.push("Nombre completo");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push("Email válido");
    if (zip && zip.length < 4) errs.push("CP válido");
    if (phone && onlyDigits(phone).length < 7) errs.push("Teléfono válido");

    if (errs.length) {
      console.log("Errores:", errs.join(", "));
      return;
    }

    const payload = {
      fullname: fullname.trim(),
      curp: curp.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      street,
      colonia,
      zip: onlyDigits(zip),
      town,
      township,
      phone: onlyDigits(phone),
      stature: onlyDigits(stature),
      weight: onlyDigits(weight),
      marital,
      birthdate: dYear && dMonth && dDay ? `${dYear}-${dMonth}-${dDay}` : null,
    };
    console.log("SAVE:", payload);
    // POST a tu API...
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 140 }}
      >
        {/* Header con back */}
        <View className="mb-4 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="p-2 mr-2 rounded-full active:bg-zinc-100 dark:active:bg-zinc-800"
            accessibilityLabel="Volver"
          >
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </Pressable>
          <Text className="text-3xl font-bold tracking-tight" style={{ color: COLORS.text }}>
            My Information
          </Text>
        </View>

        {/* Avatar */}
        <View className="items-center mb-6">
          <Image
            source={{ uri: avatarUri }}
            onError={() =>
              setAvatarUri(
                "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0"
              )
            }
            className="h-36 w-36 rounded-full"
          />
        </View>

        {/* Campos */}
        <Field label="Full name" placeholder="Nombre completo" value={fullname} onChangeText={setFullname} />
        <Field label="CURP" placeholder="LOVA031223MMNMRLA1" value={curp} onChangeText={(t) => setCurp(t.toUpperCase())} />

        {/* Fecha de nacimiento */}
        <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Date of birth</Text>
        <View className="mb-4 flex-row items-center gap-3">
          <View className="flex-1">
            <Select value={dDay} items={days} onChange={setDDay} placeholder="DD" />
          </View>
          <View className="flex-[1.2]">
            <Select value={dMonth} items={months} onChange={setDMonth} placeholder="MM" />
          </View>
          <View className="flex-[1.1]">
            <Select value={dYear} items={years} onChange={setDYear} placeholder="YYYY" />
          </View>
        </View>

        <Select label="Marital status" value={marital} items={maritalOptions} onChange={setMarital} placeholder="Selecciona estado civil" />

        <Field label="Email address" placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label="Calle y número" placeholder="Paseo del Ebano No.282" value={street} onChangeText={setStreet} />
        <Field label="Colonia" placeholder="Prados Verdes" value={colonia} onChangeText={setColonia} />
        <Field label="Zip code" placeholder="58110" value={zip} onChangeText={(t) => setZip(onlyDigits(t))} keyboardType="number-pad" />
        <Field label="Town" placeholder="Morelia" value={town} onChangeText={setTown} />
        <Field label="Township" placeholder="Morelia" value={township} onChangeText={setTownship} />
        <Field label="Phone number" placeholder="443 422 7564" value={phone} onChangeText={(t) => setPhone(onlyDigits(t))} keyboardType="phone-pad" />

        {/* Estatura y Peso */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Stature" placeholder="170 (cm)" value={stature} onChangeText={(t) => setStature(onlyDigits(t))} keyboardType="numeric" />
          </View>
          <View className="flex-1">
            <Field label="Weight" placeholder="70 (kg)" value={weight} onChangeText={(t) => setWeight(onlyDigits(t))} keyboardType="numeric" />
          </View>
        </View>

        {/* Guardar */}
        <Pressable
          className="mt-2 h-12 items-center justify-center rounded-xl active:opacity-90"
          onPress={onSave}
          style={{ backgroundColor: "#1677C3" }}
        >
          <Text className="text-base font-semibold text-white">SAVE</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
