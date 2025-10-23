import React from "react";
import { ScrollView, Text, View } from "react-native";
import BottomNav from "../../components/BottomNav"; // ✅ Importamos nuestro BottomNav
import HeaderSearch from "../../components/HeaderSearch";
import ProductCarousel from "../../components/ProductCarousel";

const today = [
  { id: "101", title: "Motosierra Husqvarna 585XP", price: 10, per: "2 tow days", image: "http://bit.ly/4qoOoXG" },
  { id: "102", title: "Folding Chairs Sc Black 12 pack", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG" },
  { id: "103", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG" },
  { id: "104", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG" },
  { id: "105", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG" },
  { id: "106", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG" },
  { id: "107", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG" },
];

const popularHome = [
  { id: "201", title: "Descripcion del producto larga o corta", price: 42, per: "2 tow days", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8" },
  { id: "202", title: "Descripcion del producto larga o corta", price: 42, per: "2 tow days", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d" },
  { id: "203", title: "Descripcion del producto larga o corta", price: 42, per: "2 tow days", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97" },
];

const recommended = [
  { id: "301", title: "Taladro Inalámbrico Pro", price: 25, per: "2 tow days", image: "https://images.unsplash.com/photo-1568454537842-d933259bb258" },
  { id: "302", title: "Set de Iluminación LED", price: 35, per: "2 tow days", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26" },
  { id: "303", title: "Kärcher Hidrolavadora", price: 30, per: "2 tow days", image: "https://images.unsplash.com/photo-1606229365485-93f49d9b6d18" },
];

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header superior */}
      <HeaderSearch />

      {/* Contenido desplazable */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 80, // deja espacio para la barra inferior
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today selection */}
        <View className="px-5 pt-4">
          <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Today selection
          </Text>
        </View>
        <ProductCarousel items={today} className="mt-3" cardWidth={160} />

        {/* Popular for the home */}
        <View className="px-5 mt-6">
          <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Popular for the home
          </Text>
        </View>
        <ProductCarousel items={popularHome} className="mt-3" cardWidth={160} />

        {/* Recommended for you */}
        <View className="px-5 mt-6 mb-4">
          <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Recommended for you
          </Text>
        </View>
        <ProductCarousel items={recommended} className="mt-3" cardWidth={160} />
      </ScrollView>

      {/*Barra de navegación inferior */}
      <BottomNav />
    </View>
  );
}
