import { Image, Text, View } from "react-native";

type Props = {
  title: string;
  price: number;
  image: string;
};

export default function ItemCard({ title, price, image }: Props) {
  return (
    <View className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <Image source={{ uri: image }} className="w-full h-40" />
      <View className="p-4 gap-1">
        <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">{title}</Text>
        <Text className="text-neutral-600 dark:text-neutral-300">${price}/día</Text>
      </View>
    </View>
  );
}
