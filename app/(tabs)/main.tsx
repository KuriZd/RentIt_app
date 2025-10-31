// app/(tabs)/index.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Category } from "../(modals)/categories";
import HeaderSearch from "../../components/HeaderSearch";
import ProductCarousel from "../../components/ProductCarousel";

type Item = {
  id: string;
  title: string;
  price: number;
  per: string;
  image: string;
  category: Category["key"];
};

const today: Item[] = [
  { id: "101", title: "Motosierra Husqvarna 585XP", price: 10, per: "2 tow days", image: "http://bit.ly/4qoOoXG", category: "tools" },
  { id: "102", title: "Folding Chairs Sc Black 12 pack", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG", category: "household" },
  { id: "103", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG", category: "household" },
  { id: "104", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG", category: "electronics" },
  { id: "105", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG", category: "household" },
  { id: "106", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG", category: "household" },
  { id: "107", title: "Mesa Plegable Rectangular", price: 42, per: "2 tow days", image: "http://bit.ly/4qoOoXG", category: "household" },
];

const popularHome: Item[] = [
  { id: "201", title: "Descripcion del producto larga o corta", price: 42, per: "2 tow days", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8", category: "tools" },
  { id: "202", title: "Descripcion del producto larga o corta", price: 42, per: "2 tow days", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d", category: "electronics" },
  { id: "203", title: "Descripcion del producto larga o corta", price: 42, per: "2 tow days", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97", category: "garden" },
];

const recommended: Item[] = [
  { id: "301", title: "Taladro Inalámbrico Pro", price: 25, per: "2 tow days", image: "https://images.unsplash.com/photo-1568454537842-d933259bb258", category: "tools" },
  { id: "302", title: "Set de Iluminación LED", price: 35, per: "2 tow days", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26", category: "electronics" },
  { id: "303", title: "Kärcher Hidrolavadora", price: 30, per: "2 tow days", image: "https://images.unsplash.com/photo-1606229365485-93f49d9b6d18", category: "garden" },
];

function applyFilters(items: Item[], category?: Category["key"], q?: string) {
  const qq = (q ?? "").trim().toLowerCase();
  return items.filter((it) => {
    const byCat = category ? it.category === category : true;
    const byText = qq ? it.title.toLowerCase().includes(qq) : true;
    return byCat && byText;
  });
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [query] = useState<string>("");

  // datasets combinados (para el modo filtrado)
  const allItems = useMemo<Item[]>(
    () => [...today, ...popularHome, ...recommended],
    []
  );

  const filteredAll = useMemo(
    () => applyFilters(allItems, selectedCategory?.key, query),
    [allItems, selectedCategory, query]
  );

  // carousels individuales (para modo normal sin filtro)
  const filteredToday = useMemo(
    () => applyFilters(today, selectedCategory?.key, query),
    [selectedCategory, query]
  );
  const filteredPopular = useMemo(
    () => applyFilters(popularHome, selectedCategory?.key, query),
    [selectedCategory, query]
  );
  const filteredRecommended = useMemo(
    () => applyFilters(recommended, selectedCategory?.key, query),
    [selectedCategory, query]
  );

  const isFiltering = !!selectedCategory;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <HeaderSearch
        onCategorySelected={(cat) => setSelectedCategory(cat)}
        onSearchPress={() => {}}
        onSellPress={() => {}}
      />

      {/* Chip de filtro activo */}
      {isFiltering && (
        <View className="px-5 pt-2">
          <Pressable
            onPress={() => setSelectedCategory(null)}
            className="self-start flex-row items-center gap-2 rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800"
          >
            <Text className="text-sm text-neutral-700 dark:text-neutral-200">
              {selectedCategory?.label}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">✕</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {isFiltering ? (
          // MODO FILTRADO: solo un bloque con resultados
          <>
            <View className="px-5 pt-4">
              <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Results for {selectedCategory?.label}
              </Text>
              {filteredAll.length === 0 && (
                <Text className="mt-2 text-neutral-500 dark:text-neutral-400">
                  No hay resultados para esta categoría.
                </Text>
              )}
            </View>
            <ProductCarousel items={filteredAll} className="mt-3" cardWidth={160} />
          </>
        ) : (
          // MODO NORMAL: secciones originales
          <>
            <View className="px-5 pt-4">
              <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Today selection
              </Text>
            </View>
            <ProductCarousel items={filteredToday} className="mt-3" cardWidth={160} />

            <View className="px-5 mt-6">
              <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Popular for the home
              </Text>
            </View>
            <ProductCarousel items={filteredPopular} className="mt-3" cardWidth={160} />

            <View className="px-5 mt-6 mb-4">
              <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Recommended for you
              </Text>
            </View>
            <ProductCarousel items={filteredRecommended} className="mt-3" cardWidth={160} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
