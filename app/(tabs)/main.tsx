// app/(tabs)/main.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { Category } from "../(modals)/categories";
import HeaderSearch from "../../components/HeaderSearch";
import ProductCarousel from "../../components/ProductCarousel";
import { supabase } from "../../utils/supabase";

/* --------- Tipo que espera tu ProductCarousel --------- */
type Item = {
  id: string;
  title: string;
  price: number; // mostramos el precio total para el periodo
  per: string; // ej: "por 3 días" | "por 1 hora"
  image: string;
  category: Category["key"]; // usamos el id de categoría como string
};

/* --------- helpers --------- */
const unitLabel = (u?: string) =>
  u === "hora" ? "hora" : u === "semana" ? "semana" : "día";

function toItem(row: any): Item {
  const qty = Number(row.periodo_cantidad ?? 1) || 1;
  const perUnit = Number(row.precio ?? 0) || 0; // precio POR UNIDAD
  const total = +(perUnit * qty).toFixed(2); // total del periodo
  const unidad = unitLabel(row.unidad_precio);
  return {
    id: String(row.id),
    title: row.titulo ?? "",
    price: total,
    per: `por ${qty} ${unidad}${qty > 1 ? "s" : ""}`,
    image:
      row.url_publica ||
      "https://images.unsplash.com/photo-1762704958591-fea0534458cc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687",
    category: String(row.id_categoria ?? ""),
  };
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // datasets reales
  const [today, setToday] = useState<Item[]>([]);
  const [popularHome, setPopularHome] = useState<Item[]>([]);
  const [recommended, setRecommended] = useState<Item[]>([]);

  /* ---------- carga desde Supabase ---------- */
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      // 1) obtenemos al usuario para conocer su id
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
      }

      // 2) query base
      let queryBuilder = supabase
        .from("articulos")
        .select(
          "id, titulo, precio, unidad_precio, periodo_cantidad, url_publica, id_categoria, publicado_en, id_propietario"
        )
        .eq("estado_publicacion", "publicado")
        .order("publicado_en", { ascending: false })
        .limit(48);

      // 3) si hay usuario, excluimos sus propios artículos
      if (user?.id) {
        queryBuilder = queryBuilder.neq("id_propietario", user.id);
      }

      const { data, error } = await queryBuilder;

      if (!alive) return;

      if (error) {
        setErrorMsg(error.message);
        setToday([]);
        setPopularHome([]);
        setRecommended([]);
      } else {
        const items = (data ?? []).map(toItem);

        // dividir en 3 bloques para tu layout
        const a = items.slice(0, 12);
        const b = items.slice(12, 24);
        const c = items.slice(24, 48);

        setToday(a);
        setPopularHome(b.length ? b : a);
        setRecommended(c.length ? c : a);
      }
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- filtros en memoria ---------- */
  function applyFilters(items: Item[], category?: Category["key"], q?: string) {
    const qq = (q ?? "").trim().toLowerCase();
    return items.filter((it) => {
      const byCat = category ? it.category === category : true;
      const byText = qq ? it.title.toLowerCase().includes(qq) : true;
      return byCat && byText;
    });
  }

  const allItems = useMemo<Item[]>(
    () => [...today, ...recommended, ...dynamicSections.flatMap((s) => s.items)],
    [today, recommended, dynamicSections]
  );

  const filteredAll = useMemo(
    () => applyFilters(allItems, selectedCategory?.key, query),
    [allItems, selectedCategory, query]
  );
  const filteredToday = useMemo(
    () => applyFilters(today, selectedCategory?.key, query),
    [today, selectedCategory, query]
  );
  const filteredPopular = useMemo(
    () => applyFilters(popularHome, selectedCategory?.key, query),
    [popularHome, selectedCategory, query]
  );
  const filteredRecommended = useMemo(
    () => applyFilters(recommended, selectedCategory?.key, query),
    [recommended, selectedCategory, query]
  );

  const isFiltering = !!selectedCategory || !!query.trim();

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <HeaderSearch
        query={query}
        onQueryChange={setQuery}
        onCategorySelected={(cat) => setSelectedCategory(cat)}
        onSearchPress={() => { }}
        onSellPress={() => { }}
      />

      {/* Loading / Error */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-neutral-500 dark:text-neutral-400">
            Cargando artículos…
          </Text>
        </View>
      ) : errorMsg ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-neutral-500 dark:text-neutral-400">
            No pudimos cargar los artículos{"\n"}
            {errorMsg}
          </Text>
        </View>
      ) : (
        <>
          {/* Chip de filtro activo */}
          {(selectedCategory || query.trim()) && (
            <View className="px-5 pt-2 flex-row flex-wrap gap-2">
              {selectedCategory && (
                <Pressable
                  onPress={() => setSelectedCategory(null)}
                  className="self-start flex-row items-center gap-2 rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800"
                >
                  <Text className="text-sm text-neutral-700 dark:text-neutral-200">
                    {selectedCategory.label}
                  </Text>
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    ✕
                  </Text>
                </Pressable>
              )}
              {query.trim() ? (
                <View className="self-start rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800">
                  <Text className="text-sm text-neutral-700 dark:text-neutral-200">
                    “{query.trim()}”
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          <ScrollView
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {isFiltering ? (
              <>
                <View className="px-5 pt-4">
                  <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {selectedCategory
                      ? `Results for ${selectedCategory.label}`
                      : "Resultados"}
                  </Text>
                  {filteredAll.length === 0 && (
                    <Text className="mt-2 text-neutral-500 dark:text-neutral-400">
                      No hay resultados para este filtro.
                    </Text>
                  )}
                </View>
                <ProductCarousel
                  items={filteredAll}
                  className="mt-3"
                  cardWidth={160}
                />
              </>
            ) : (
              <>
                <View className="px-5 pt-4">
                  <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Today selection
                  </Text>
                </View>
                <ProductCarousel
                  items={filteredToday}
                  className="mt-3"
                  cardWidth={160}
                />

                <View className="px-5 mt-6">
                  <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Popular for the home
                  </Text>
                </View>
                <ProductCarousel
                  items={filteredPopular}
                  className="mt-3"
                  cardWidth={160}
                />

                <View className="px-5 mt-6 mb-4">
                  <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Recommended for you
                  </Text>
                </View>
                <ProductCarousel
                  items={filteredRecommended}
                  className="mt-3"
                  cardWidth={160}
                />
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}