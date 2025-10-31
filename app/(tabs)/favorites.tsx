// app/cart/index.tsx
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useColorScheme } from "react-native";

type Item = {
  id: string;
  title: string;
  price: number;
  image: string;
  available?: boolean;
  method?: "Envio" | "Pickup" | "Entrega";
  qty?: number;
};

const initialCart: Item[] = [
  {
    id: "spk-1",
    title: "Descripcion del producto larga o corta",
    price: 900,
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
    available: true,
    method: "Envio",
    qty: 1,
  },
  {
    id: "spk-2",
    title: "Descripcion del producto larga o corta",
    price: 900,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800",
    available: true,
    method: "Envio",
    qty: 1,
  },
];

const initialSaved: Item[] = [
  {
    id: "spk-3",
    title: "Descripcion del producto larga o corta",
    price: 900,
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
    available: true,
    method: "Envio",
    qty: 1,
  },
];

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return useMemo(
    () => ({
      isDark,
      bg: isDark ? "#0b0b0c" : "#ffffff",
      card: isDark ? "#0f1115" : "#ffffff",
      pill: isDark ? "#27272a" : "#f3f4f6",
      text: isDark ? "#fafafa" : "#111827",
      subtext: isDark ? "#a1a1aa" : "#52525b",
      success: "#16a34a",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
    }),
    [isDark]
  );
}

/* ---------- Componente de control de cantidad ---------- */
function QtyControl({
  value,
  onChange,
  pill,
  ring,
  text,
  icon,
}: {
  value: number;
  onChange: (v: number) => void;
  pill: string;
  ring: string;
  text: string;
  icon: string;
}) {
  return (
    <View
      className="flex-row items-center rounded-full border px-2"
      style={{ backgroundColor: pill, borderColor: ring }}
    >
      <Pressable onPress={() => onChange(Math.max(1, value - 1))} className="h-8 w-8 items-center justify-center">
        <Feather name="minus" size={16} color={icon} />
      </Pressable>
      <Text className="px-3 text-base font-medium" style={{ color: text }}>
        {value}
      </Text>
      <Pressable onPress={() => onChange(value + 1)} className="h-8 w-8 items-center justify-center">
        <Feather name="plus" size={16} color={icon} />
      </Pressable>
    </View>
  );
}

/* ---------- Botón tipo píldora ---------- */
function PillButton({
  label,
  onPress,
  pill,
  ring,
  text,
  leftIcon,
}: {
  label: string;
  onPress: () => void;
  pill: string;
  ring: string;
  text: string;
  leftIcon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="h-9 rounded-full px-3 flex-row items-center justify-center border mr-2 mb-2"
      style={{ backgroundColor: pill, borderColor: ring }}
    >
      {leftIcon && <View className="mr-1">{leftIcon}</View>}
      <Text className="text-sm font-semibold" style={{ color: text }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- Tarjeta de carrito ---------- */
function CartCard({
  item,
  onQty,
  onSaveForLater,
  onSimilar,
  onDelete,
}: {
  item: Item;
  onQty: (qty: number) => void;
  onSaveForLater: () => void;
  onSimilar: () => void;
  onDelete: () => void;
}) {
  const C = useColors();

  return (
    <View className="flex-row rounded-3xl p-3 mb-4 mt-6" style={{ backgroundColor: C.card, borderColor: C.ring, borderWidth: 1 }}>
      <Image source={{ uri: item.image }} className="w-24 h-24 rounded-xl" />
      <View className="flex-1 pl-3">
        <Text className="text-[13px] leading-4 mb-1" style={{ color: C.text }}>
          {item.title}
        </Text>
        <Text className="text-lg font-black" style={{ color: C.text }}>
          ${item.price}
        </Text>
        <Text className="text-[13px] mt-1" style={{ color: C.success }}>
          Disponible
        </Text>
        <Text className="text-[13px]" style={{ color: C.text }}>
          Método de Recolección:
        </Text>
        <Text className="text-[13px] -mt-1 mb-2 font-semibold" style={{ color: C.text }}>
          {item.method || "Envio"}
        </Text>

        {/* Botones alineados a la izquierda con wrap */}
        <View className="flex-row flex-wrap items-start justify-start mt-1">
          <View className="mr-2 mb-2">
            <QtyControl value={item.qty || 1} onChange={onQty} pill={C.pill} ring={C.ring} text={C.text} icon={C.icon} />
          </View>
          <PillButton label="Eliminar" onPress={onDelete} pill={C.pill} ring={C.ring} text={C.text} />
          <PillButton
            label="Guardar para más tarde"
            onPress={onSaveForLater}
            pill={C.pill}
            ring={C.ring}
            text={C.text}
            leftIcon={<Feather name="bookmark" size={14} color={C.icon} />}
          />
          <PillButton
            label="Productos Similares"
            onPress={onSimilar}
            pill={C.pill}
            ring={C.ring}
            text={C.text}
            leftIcon={<Feather name="box" size={14} color={C.icon} />}
          />
        </View>
      </View>
    </View>
  );
}

/* ---------- Tarjeta de “guardado para después” ---------- */
function SavedCard({
  item,
  onMoveToCart,
  onDelete,
}: {
  item: Item;
  onMoveToCart: () => void;
  onDelete: () => void;
}) {
  const C = useColors();

  return (
    <View className="flex-row rounded-3xl p-3 mb-4" style={{ backgroundColor: C.card, borderColor: C.ring, borderWidth: 1 }}>
      <Image source={{ uri: item.image }} className="w-24 h-24 rounded-xl" />
      <View className="flex-1 pl-3">
        <Text className="text-[13px] leading-4 mb-1" style={{ color: C.text }}>
          {item.title}
        </Text>
        <Text className="text-lg font-black" style={{ color: C.text }}>
          ${item.price}
        </Text>
        <Text className="text-[13px] mt-1" style={{ color: C.success }}>
          Disponible
        </Text>
        <Text className="text-[13px]" style={{ color: C.text }}>
          Método de Recolección:
        </Text>
        <Text className="text-[13px] -mt-1 mb-2 font-semibold" style={{ color: C.text }}>
          {item.method || "Envio"}
        </Text>

        {/* Botones con wrap alineados a la izquierda */}
        <View className="flex-row flex-wrap items-start justify-start mt-10">
          <PillButton
            label="Mover al carrito"
            onPress={onMoveToCart}
            pill={C.pill}
            ring={C.ring}
            text={C.text}
            leftIcon={<Feather name="shopping-cart" size={14} color={C.icon} />}
          />
          <PillButton
            label="Eliminar"
            onPress={onDelete}
            pill={C.pill}
            ring={C.ring}
            text={C.text}
            leftIcon={<Feather name="trash-2" size={14} color={C.icon} />}
          />
        </View>
      </View>
    </View>
  );
}

/* ---------- Pantalla principal ---------- */
export default function ShoppingCartScreen() {
  const C = useColors();
  const [cart, setCart] = useState<Item[]>(initialCart);
  const [saved, setSaved] = useState<Item[]>(initialSaved);

  const setQty = (id: string, qty: number) => setCart((prev) => prev.map((it) => (it.id === id ? { ...it, qty } : it)));
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((it) => it.id !== id));
  const saveForLater = (it: Item) => {
    setCart((prev) => prev.filter((x) => x.id !== it.id));
    setSaved((prev) => [it, ...prev]);
  };
  const moveToCart = (it: Item) => {
    setSaved((prev) => prev.filter((x) => x.id !== it.id));
    setCart((prev) => [it, ...prev]);
  };
  const removeFromSaved = (id: string) => setSaved((prev) => prev.filter((it) => it.id !== id));

  const subtotal = cart.reduce((acc, it) => acc + (it.price * (it.qty || 1)), 0);

  return (
    <View className="flex-1 mt-10" style={{ backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-3xl font-extrabold mb-4" style={{ color: C.text }}>
          Shopping Cart
        </Text>

        {cart.map((it) => (
          <CartCard
            key={it.id}
            item={it}
            onQty={(q) => setQty(it.id, q)}
            onSaveForLater={() => saveForLater(it)}
            onSimilar={() => {}}
            onDelete={() => removeFromCart(it.id)}
          />
        ))}

        {/* Subtotal */}
        <View className="mt-2 mb-8 rounded-2xl px-4 py-3 border" style={{ borderColor: C.ring, backgroundColor: C.card }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-base" style={{ color: C.text }}>
              Subtotal
            </Text>
            <Text className="text-lg font-bold" style={{ color: C.text }}>
              ${subtotal.toFixed(2)}
            </Text>
          </View>
          <Pressable className="mt-3 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: "#111827" }}>
            <Text className="text-white font-semibold">Proceder al pago</Text>
          </Pressable>
        </View>

        {/* Guardados */}
        <Text className="text-2xl font-extrabold mb-3" style={{ color: C.text }}>
          save for later
        </Text>

        {saved.map((it) => (
          <SavedCard
            key={it.id}
            item={it}
            onMoveToCart={() => moveToCart(it)}
            onDelete={() => removeFromSaved(it.id)}
          />
        ))}

        {saved.length === 0 && (
          <Text className="text-sm" style={{ color: C.subtext }}>
            No tienes artículos guardados para más tarde.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
