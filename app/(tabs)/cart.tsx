// app/cart/index.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { supabase } from "../../utils/supabase";

type DeliveryMethod = "Envio" | "Pickup" | "Entrega";
type UnidadPrecio = "hora" | "dia" | "semana";
type CartItemState = "active" | "saved";

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
  state?: CartItemState;
};

type CartRow = {
  id: string;
  id_perfil: string;
  status: "active" | "ordered" | "abandoned" | "canceled";
};

type ToastState =
  | {
    type: "success" | "error";
    title: string;
    message?: string;
  }
  | null;

type ToastProps = {
  toast: ToastState;
  onDismiss: () => void;
};

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
    state: row.estado as CartItemState | undefined,
  };
}

// ---------- TOASTS ----------

function AnimatedToast({ toast, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 7,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast, translateY, opacity, scale]);

  if (!toast) return null;

  const bgColor = toast.type === "success" ? "#10b981" : "#ef4444";
  const icon = toast.type === "success" ? "check-circle" : "alert-circle";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: Platform.OS === "ios" ? 24 : 16,
        left: 16,
        right: 16,
        zIndex: 999,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }, { scale }],
          opacity,
        }}
      >
        <Pressable
          onPress={onDismiss}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: bgColor,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name={icon as any} size={20} color="#fff" />
          </View>

          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "700",
                letterSpacing: 0.2,
              }}
            >
              {toast.title}
            </Text>
            {toast.message && (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  marginTop: 2,
                  opacity: 0.95,
                  lineHeight: 18,
                }}
              >
                {toast.message}
              </Text>
            )}
          </View>

          <Pressable
            onPress={onDismiss}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={16} color="#fff" />
          </Pressable>

          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              overflow: "hidden",
            }}
          >
            <ProgressBar duration={3000} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function ProgressBar({ duration }: { duration: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: 100,
      duration,
      useNativeDriver: false,
    }).start();
  }, [duration, width]);

  const widthInterpolated = width.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={{
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        width: widthInterpolated,
      }}
    />
  );
}

function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (config: NonNullable<ToastState>, duration = 3000) => {
      setToast(config);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    },
    []
  );

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setToast(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { toast, showToast, hideToast };
}

// ---------- UI helpers ----------

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
        <Text
          className="text-[13px] mt-1"
          style={{ color: item.available ? C.success : C.subtext }}
        >
          {item.available ? "Disponible" : "No disponible"}
        </Text>
        <Text className="text-[13px]" style={{ color: C.text }}>
          Método de recolección:
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
            label="Productos similares"
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
        <Text
          className="text-[13px] mt-1"
          style={{ color: item.available ? C.success : C.subtext }}
        >
          {item.available ? "Disponible" : "No disponible"}
        </Text>
        <Text className="text-[13px]" style={{ color: C.text }}>
          Método de recolección:
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

// ---------- Screen ----------

export default function ShoppingCartScreen() {
  const C = useColors();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [cart, setCart] = useState<Item[]>([]);
  const [saved, setSaved] = useState<Item[]>([]);
  const { toast, showToast, hideToast } = useToast();

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
            disponible,
            estado
          `
          )
          .eq("id_carrito", cartRow.id);

        if (itemsRes.error) throw itemsRes.error;

        const rows = (itemsRes.data ?? []) as any[];

        const activeRows = rows.filter(
          (r) => r.estado === "active" || !r.estado
        );
        const savedRows = rows.filter((r) => r.estado === "saved");

        const activeItems = activeRows.map(rowToUI);
        const savedItems = savedRows.map(rowToUI);

        setCart(activeItems);
        setSaved(savedItems);
      } catch (e: any) {
        showToast({
          type: "error",
          title: "Error",
          message: e?.message ?? "No se pudo cargar el carrito.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const setQty = async (id: string, qty: number) => {
    const { error } = await supabase
      .from("cart_items")
      .update({ qty })
      .eq("id", id);

    if (error) {
      showToast({
        type: "error",
        title: "Error al actualizar",
        message: "No se pudo actualizar la cantidad.",
      });
      return;
    }

    setCart((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty } : it))
    );
  };

  const removeFromCart = async (id: string) => {
    const item = cart.find((x) => x.id === id);
    const { error } = await supabase.from("cart_items").delete().eq("id", id);

    if (error) {
      showToast({
        type: "error",
        title: "Error al eliminar",
        message: "No se pudo eliminar el artículo.",
      });
      return;
    }

    setCart((prev) => prev.filter((it) => it.id !== id));

    showToast({
      type: "success",
      title: "Artículo eliminado",
      message: item
        ? `"${item.title}" se eliminó del carrito.`
        : "El artículo se eliminó del carrito.",
    });
  };

  const saveForLater = async (it: Item) => {
    const { error } = await supabase
      .from("cart_items")
      .update({ estado: "saved" })
      .eq("id", it.id);

    if (error) {
      showToast({
        type: "error",
        title: "Error al guardar",
        message: "No se pudo guardar el artículo para más tarde.",
      });
      return;
    }

    setCart((prev) => prev.filter((x) => x.id !== it.id));
    setSaved((prev) => [it, ...prev]);

    showToast({
      type: "success",
      title: "Guardado para más tarde",
      message: `"${it.title}" se movió a guardados.`,
    });
  };

  const moveToCart = async (it: Item) => {
    const { error } = await supabase
      .from("cart_items")
      .update({ estado: "active" })
      .eq("id", it.id);

    if (error) {
      showToast({
        type: "error",
        title: "Error al mover",
        message: "No se pudo mover el artículo al carrito.",
      });
      return;
    }

    setSaved((prev) => prev.filter((x) => x.id !== it.id));
    setCart((prev) => [it, ...prev]);

    showToast({
      type: "success",
      title: "Artículo en el carrito",
      message: `"${it.title}" se movió al carrito.`,
    });
  };

  const removeFromSaved = async (id: string) => {
    const item = saved.find((x) => x.id === id);
    const { error } = await supabase.from("cart_items").delete().eq("id", id);

    if (error) {
      showToast({
        type: "error",
        title: "Error al eliminar",
        message: "No se pudo eliminar el artículo de guardados.",
      });
      return;
    }

    setSaved((prev) => prev.filter((it) => it.id !== id));
  };

  showToast({
    type: "success",
    title: "Eliminado de guardados",
    message: item
      ? `"${item.title}" se eliminó de guardados.`
      : "El artículo se eliminó de guardados.",
  });
};

const handleCheckout = () => {
  if (!cart.length) {
    showToast({
      type: "error",
      title: "Carrito vacío",
      message: "Agrega artículos antes de pagar.",
    });
    return;
  }

  if (!cartId || !perfilId) {
    showToast({
      type: "error",
      title: "Error",
      message:
        "No se pudo obtener la información del carrito. Intenta de nuevo.",
    });
    return;
  }

  const firstArticle = cart[0];

  router.push({
    pathname: "/(checkout)/payment-method",
    params: {
      cartId,
      userId: perfilId,
      articleId: String(firstArticle.articleId),
      articleIds: cart.map((it) => String(it.articleId)).join(","),
    },
  });
};

const subtotal = useMemo(
  () => cart.reduce((acc, it) => acc + it.price * (it.qty ?? 1), 0),
  [cart]
);

const subtotalFixed = Number.isFinite(subtotal)
  ? subtotal.toFixed(2)
  : "0.00";

if (loading) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
      <Text style={{ marginTop: 8 }}>Cargando carrito…</Text>
    </View>
  );
}

return (
  <View className="flex-1 mt-10" style={{ backgroundColor: C.bg }}>
    <AnimatedToast toast={toast} onDismiss={hideToast} />

    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text
        className="text-3xl font-extrabold mb-4"
        style={{ color: C.text }}
      >
        Carrito de compras
      </Text>

      {cart.map((it) => (
        <CartCard
          key={it.id}
          item={it}
          onQty={(q) => setQty(it.id, q)}
          onSaveForLater={() => saveForLater(it)}
          onSimilar={() => { }}
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
          <Text className="text-white font-semibold">Proceder al pago</Text>
        </Pressable>
      </View>

      <Text
        className="text-2xl font-extrabold mb-3"
        style={{ color: C.text }}
      >
        Guardados para más tarde
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
