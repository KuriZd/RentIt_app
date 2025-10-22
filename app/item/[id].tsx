import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import Button from "../../components/ui/button";

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Puedes sustituir esto con datos reales (Supabase o API)
  const product = {
    title: `Artículo #${id}`,
    description:
      "Excelente estado, listo para usarse. Incluye accesorios básicos y mantenimiento reciente.",
    price: 42,
    per: "2 days",
    image: `https://picsum.photos/seed/${id}/800/600`,
    seller: "Juan Pérez",
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-900">
      {/* Imagen principal */}
      <Image
        source={{ uri: product.image }}
        className="w-full h-64"
        resizeMode="cover"
      />

      {/* Información */}
      <View className="px-6 py-5 gap-3">
        <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {product.title}
        </Text>

        <Text className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          ${product.price} USD for {product.per}
        </Text>

        <Text className="text-neutral-600 dark:text-neutral-300 leading-5">
          {product.description}
        </Text>

        <View className="mt-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
          <Text className="text-base font-medium text-neutral-800 dark:text-neutral-200">
            Seller: {product.seller}
          </Text>
        </View>

        <View className="mt-6">
          <Button
            label="Solicitar renta"
            variant="primary"
            onPress={() => {
              // Aquí podrías abrir un modal o enviar solicitud
              alert("Solicitud enviada 🚀");
              router.back();
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
