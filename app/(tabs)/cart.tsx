// app/cart/index.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { supabase } from "../../utils/supabase";

type DeliveryMethod = "Envio" | "Pickup" | "Entrega";
type UnidadPrecio = "hora" | "dia" | "semana";

type Item = {
  id: string;
  articleId: number;
  title: string;
  price: number;
  image: string;
  available?: boolean;
  method?: DeliveryMethod;
  qty?: number;
  unit?: UnidadPrecio;
  periodQty?: number;
  deliveryFee?: number;
  pickupOnly?: boolean;
  deliveryAvailable?: boolean;
};

type CartRow = {
  id: string;
  id_perfil: string;
  status: "active" | "ordered" | "abandoned" | "canceled";
};

type CartTotalsRow = {
  id_carrito: string;
  id_perfil: string;
  subtotal: number;
  items_count: number;
};

function addPeriods(base: Date, unit: UnidadPrecio, periods: number): Date {
  const d = new Date(base);
  switch (unit) {
    case "hora":
      d.setHours(d.getHours() + periods);
      break;
    case "semana":
      d.setDate(d.getDate() + periods * 7);
      break;
    case "dia":
    default:
      d.setDate(d.getDate() + periods);
      break;
  }
  return d;
}

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      iconMuted: isDark ? "#a1a1aa" : "#6b7280",
      ring: isDark ? "#3f3f46" : "#e5e7eb",
      overlay: "rgba(0,0,0,0.30)",
    }),
    [isDark]
  );

  const bg = isDark ? "#0b0b0c" : "#ffffff";
  const card = isDark ? "#0f1115" : "#ffffff";
  const text = isDark ? "#fafafa" : "#111827";
  const subtext = isDark ? "#a1a1aa" : "#52525b";
  const success = "#16a34a";

  return {
    isDark,
    bg,
    card,
    text,
    subtext,
    success,
    ...COLORS,
  };
}

async function getCurrentPerfilId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

async function getOrCreateActiveCart(id_perfil: string): Promise<CartRow> {
  const found = await supabase
    .from("carts")
    .select("*")
    .eq("id_perfil", id_perfil)
    .eq("status", "active")
    .maybeSingle();

  if (found.error && found.error.code !== "PGRST116") throw found.error;
  if (found.data) return found.data as CartRow;

  const ins = await supabase
    .from("carts")
    .insert({ id_perfil, status: "active" })
    .select("*")
    .single();

  if (ins.error) throw ins.error;
  return ins.data as CartRow;
}

function rowToUI(row: any): Item {
  return {
    id: row.id,
    articleId: Number(row.id_articulo),
    title: row.titulo_cached,
    price: Number(row.precio),
    image: row.image_url ?? "",
    available: !!row.disponible,
    method: row.metodo as DeliveryMethod,
    qty: row.qty ? Number(row.qty) : 1,
    unit: row.unidad as UnidadPrecio | undefined,
    periodQty: row.periodo_cantidad ? Number(row.periodo_cantidad) : 1,
    deliveryFee: row.tarifa_entrega ? Number(row.tarifa_entrega) : 0,
    pickupOnly: !!row.solo_retiro,
    deliveryAvailable: !!row.entrega_disponible,
  };
}

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
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        className="h-8 w-8 items-center justify-center"
      >
        <Feather name="minus" size={16} color={icon} />
      </Pressable>
      <Text className="px-3 text-base font-medium" style={{ color: text }}>
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        className="h-8 w-8 items-center justify-center"
      >
        <Feather name="plus" size={16} color={icon} />
      </Pressable>
    </View>
  );
}

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
    <View
      className="flex-row rounded-3xl p-3 mb-4 mt-6"
      style={{ backgroundColor: C.card, borderColor: C.ring, borderWidth: 1 }}
    >
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
        <Text
          className="text-[13px] -mt-1 mb-2 font-semibold"
          style={{ color: C.text }}
        >
          {item.method || "Envio"}
        </Text>

        <View className="flex-row flex-wrap items-start justify-start mt-1">
          <View className="mr-2 mb-2">
            <QtyControl
              value={item.qty || 1}
              onChange={onQty}
              pill={C.pill}
              ring={C.ring}
              text={C.text}
              icon={C.icon}
            />
          </View>
          <PillButton
            label="Eliminar"
            onPress={onDelete}
            pill={C.pill}
            ring={C.ring}
            text={C.text}
          />
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
    <View
      className="flex-row rounded-3xl p-3 mb-4"
      style={{ backgroundColor: C.card, borderColor: C.ring, borderWidth: 1 }}
    >
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
        <Text
          className="text-[13px] -mt-1 mb-2 font-semibold"
          style={{ color: C.text }}
        >
          {item.method || "Envio"}
        </Text>

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

export default function ShoppingCartScreen() {
  const C = useColors();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [cart, setCart] = useState<Item[]>([]);
  const [saved, setSaved] = useState<Item[]>([]);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const currentPerfilId = await getCurrentPerfilId();
        if (!currentPerfilId) {
          setLoading(false);
          return;
        }

        setPerfilId(currentPerfilId);

        const cartRow = await getOrCreateActiveCart(currentPerfilId);
        setCartId(cartRow.id);

        const itemsRes = await supabase
          .from("cart_items")
          .select(
            `
            id,
            id_carrito,
            id_articulo,
            titulo_cached,
            image_url,
            precio,
            unidad,
            periodo_cantidad,
            qty,
            metodo,
            tarifa_entrega,
            solo_retiro,
            entrega_disponible,
            disponible
          `
          )
          .eq("id_carrito", cartRow.id);

        const totalsRes = await supabase
          .from("cart_totals")
          .select("*")
          .eq("id_carrito", cartRow.id)
          .maybeSingle();

        if (itemsRes.error) throw itemsRes.error;
        if (totalsRes.error && totalsRes.error.code !== "PGRST116")
          throw totalsRes.error;

        const rows = (itemsRes.data ?? []) as any[];
        const items = rows.map(rowToUI);
        setCart(items);

        const total =
          totalsRes.data && (totalsRes.data as CartTotalsRow).subtotal != null
            ? Number((totalsRes.data as CartTotalsRow).subtotal)
            : items.reduce((acc, it) => acc + it.price * (it.qty ?? 1), 0);

        setSubtotal(total);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "No se pudo cargar el carrito");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setQty = async (id: string, qty: number) => {
    setCart((prev) => prev.map((it) => (it.id === id ? { ...it, qty } : it)));
    setSubtotal((prev) => {
      const item = cart.find((x) => x.id === id);
      if (!item) return prev;
      const old = (item.qty || 1) * item.price;
      const neu = qty * item.price;
      return prev - old + neu;
    });
    const { error } = await supabase
      .from("cart_items")
      .update({ qty })
      .eq("id", id);
    if (error) Alert.alert("Error", "No se pudo actualizar la cantidad");
  };

  const removeFromCart = async (id: string) => {
    const item = cart.find((x) => x.id === id);
    setCart((prev) => prev.filter((it) => it.id !== id));
    if (item) setSubtotal((p) => p - item.price * (item.qty || 1));
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) Alert.alert("Error", "No se pudo eliminar el artículo");
  };

  const saveForLater = (it: Item) => {
    setCart((prev) => prev.filter((x) => x.id !== it.id));
    setSaved((prev) => [it, ...prev]);
    setSubtotal((p) => p - it.price * (it.qty || 1));
  };

  const moveToCart = (it: Item) => {
    setSaved((prev) => prev.filter((x) => x.id !== it.id));
    setCart((prev) => [it, ...prev]);
    setSubtotal((p) => p + it.price * (it.qty || 1));
  };

  const removeFromSaved = (id: string) =>
    setSaved((prev) => prev.filter((it) => it.id !== id));

    const handleCheckout = () => {
    if (!cart.length) {
      Alert.alert("Carrito vacío", "Agrega artículos antes de pagar.");
      return;
    }

    if (!cartId || !perfilId) {
      Alert.alert(
        "Error",
        "No se pudo obtener la información del carrito. Intenta de nuevo."
      );
      return;
    }

    const firstArticle = cart[0];

    router.push({
      pathname: "/payment-method",
      params: {
        cartId,
        userId: perfilId,
        articleId: String(firstArticle.articleId),
      },
    });
  };


  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Cargando carrito…</Text>
      </View>
    );
  }

  const subtotalFixed = Number.isFinite(subtotal)
    ? subtotal.toFixed(2)
    : "0.00";

  return (
    <View className="flex-1 mt-10" style={{ backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text
          className="text-3xl font-extrabold mb-4"
          style={{ color: C.text }}
        >
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

        <View
          className="mt-2 mb-8 rounded-2xl px-4 py-3 border"
          style={{ borderColor: C.ring, backgroundColor: C.card }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-base" style={{ color: C.text }}>
              Subtotal
            </Text>
            <Text className="text-lg font-bold" style={{ color: C.text }}>
              ${subtotalFixed}
            </Text>
          </View>
          <Pressable
            className="mt-3 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: "#111827" }}
            onPress={handleCheckout}
            disabled={!cart.length}
          >
            <Text className="text-white font-semibold">
              Proceder al pago
            </Text>
          </Pressable>
        </View>

        <Text
          className="text-2xl font-extrabold mb-3"
          style={{ color: C.text }}
        >
          Save for Later
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
