import { Link } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

type Item = { id: string; title: string; price: number; per: string; image: string };

export default function ProductCard({ item, width = 160 }: { item: Item; width?: number }) {
  const imageH = width * 0.9; // más cuadrado (antes era más bajo)
  return (
    <Link href={{ pathname: "/item/[id]", params: { id: item.id } }} asChild>
      <Pressable style={{ width }}>
        <View className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900">
          <Image
            source={{ uri: item.image }}
            style={{ width, height: imageH }}
            className="rounded-2xl"
            resizeMode="cover"
          />
          {/* Badge */}
          <View className="absolute left-2 top-2 bg-white/95 px-3 py-1 rounded-xl">
            <Text className="text-[11px] font-medium text-neutral-900">
              customer{"\n"}favorite
            </Text>
          </View>
        </View>

        <View className="mt-2">
          <Text
            numberOfLines={2}
            className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
          >
            {item.title}
          </Text>
          <Text className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
            ${item.price} USD for {item.per}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
