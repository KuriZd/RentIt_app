import { FlatList, View } from "react-native";
import ProductCard from "./ProductCard";

type Item = { id: string; title: string; price: number; per: string; image: string };

export default function ProductCarousel({
  items,
  className,
  cardWidth = 160,
}: {
  items: Item[];
  className?: string;
  cardWidth?: number;
}) {
  return (
    <View className={className}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item }) => <ProductCard item={item} width={cardWidth} />}
      />
    </View>
  );
}
