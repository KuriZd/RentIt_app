import { Link } from "expo-router";
import { Image, Pressable, Text, View, useColorScheme } from "react-native";

type Item = {
  id: string;
  title: string;
  price: number;
  per: string;
  image: string;
  badge?: string;
};

export default function ProductCard({
  item,
  width = 160,
}: {
  item: Item;
  width?: number;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const imageH = width * 0.9;

  return (
    <Link href={{ pathname: "/item/[id]", params: { id: item.id } }} asChild>
      <Pressable
        style={{ width }}
        className="active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel={`Abrir artículo ${item.title}`}
      >
        {/* Imagen */}
        <View
          className="rounded-2xl overflow-hidden border"
          style={{
            borderColor: isDark ? "#27272a" : "#e5e7eb",
            backgroundColor: isDark ? "#18181b" : "#fff",
          }}
        >
          <Image
            source={{ uri: item.image }}
            style={{ width, height: imageH }}
            className="rounded-2xl"
            resizeMode="cover"
          />

          {/* Badge dinámico */}
          {item.badge && (
            <View className="absolute left-2 top-2 bg-white/95 dark:bg-black/80 px-3 py-1 rounded-xl">
              <Text className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100">
                {item.badge}
              </Text>
            </View>
          )}
        </View>

        {/* Texto */}
        <View className="mt-2">
          <Text
            numberOfLines={2}
            className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
          >
            {item.title}
          </Text>

          <Text className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
            ${item.price} USD / {item.per}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
