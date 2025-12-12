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

type Item = {
  id: string;
  title: string;
  price: number;
  per: string;
  image: string;
  category: Category["key"];
};

type CategoryRow = {
  id: number;
  nombre: string | null;
  slug: string | null;
};

type DynamicSection = {
  categoryId: string;
  categoryName: string;
  items: Item[];
};

const unitLabel = (u?: string) =>
  u === "hora" ? "hora" : u === "semana" ? "semana" : "día";

function toItem(row: any): Item {
  const qty = Number(row.periodo_cantidad ?? 1) || 1;
  const perUnit = Number(row.precio ?? 0) || 0;
  const total = +(perUnit * qty).toFixed(2);
  const unidad = unitLabel(row.unidad_precio);

  return {
    id: String(row.id),
    title: row.titulo ?? "",
    price: total,
    per: `por ${qty} ${unidad}${qty > 1 ? "s" : ""}`,
    image:
      row.url_publica ||
      "https://images.unsplash.com/photo-1762704958591-fea0534458cc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687",
    category: String(row.id_categoria ?? "") as Category["key"],
  };
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // estáticos
  const [today, setToday] = useState<Item[]>([]);
  const [recommended, setRecommended] = useState<Item[]>([]);

  // dinámicos (máx 4)
  const [dynamicSections, setDynamicSections] = useState<DynamicSection[]>([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) console.error(userError);

      const [artRes, catRes] = await Promise.all([
        supabase
          .from("articulos")
          .select(
            "id, titulo, precio, unidad_precio, periodo_cantidad, url_publica, id_categoria, publicado_en, id_propietario"
          )
          .eq("estado_publicacion", "publicado")
          .order("publicado_en", { ascending: false })
          .limit(120)
          // si hay usuario, no mostrar sus propios artículos
          .neq("id_propietario", user?.id ?? ""),
        supabase.from("categorias").select("id, nombre, slug"),
      ]);

      if (!alive) return;

      if (artRes.error || catRes.error) {
        console.error(artRes.error || catRes.error);
        setErrorMsg(
          artRes.error?.message ||
          catRes.error?.message ||
          "Error al cargar los artículos."
        );
        setToday([]);
        setRecommended([]);
        setDynamicSections([]);
        setLoading(false);
        return;
      }

      const artRows = artRes.data ?? [];
      const catRows = (catRes.data ?? []) as CategoryRow[];

      const allItems = artRows.map(toItem);

      // Today & Recommended (estáticos)
      const a = allItems.slice(0, 12);
      const b = allItems.slice(12, 24);

      setToday(a);
      setRecommended(b.length ? b : a);

      // mapa id_categoria -> nombre
      const catNameById = new Map<string, string>();
      catRows.forEach((c) => {
        if (c.id != null) {
          catNameById.set(String(c.id), c.nombre || `Categoría ${c.id}`);
        }
      });

      // agrupar por categoría
      const byCategory = new Map<string, DynamicSection>();

      allItems.forEach((it) => {
        const raw = (it.category as any) ?? "";
        const catId = String(raw);

        // evitamos ids vacíos / undefined / null
        if (!raw || catId === "undefined" || catId === "null") return;

        const name = catNameById.get(catId) ?? `Categoría ${catId}`;
        const existing = byCategory.get(catId);

        if (existing) {
          existing.items.push(it);
        } else {
          byCategory.set(catId, {
            categoryId: catId,
            categoryName: name,
            items: [it],
          });
        }
      });

      const sortedSections = Array.from(byCategory.values())
        .sort((a, b) => b.items.length - a.items.length)
        .slice(0, 4);

      setDynamicSections(sortedSections);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

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
  const filteredRecommended = useMemo(
    () => applyFilters(recommended, selectedCategory?.key, query),
    [recommended, selectedCategory, query]
  );

  const filteredDynamicSections = useMemo(() => {
    if (!selectedCategory && !query.trim()) return dynamicSections;
    return dynamicSections
      .map((sec) => ({
        ...sec,
        items: applyFilters(sec.items, selectedCategory?.key, query),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [dynamicSections, selectedCategory, query]);

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
                      ? `Resultados para ${selectedCategory.label}`
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
                {/* Today (estático) */}
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

                {/* Secciones dinámicas por categoría */}
                {filteredDynamicSections.map((sec, index) => (
                  <View
                    key={`cat-section-${sec.categoryId || `idx-${index}`}`}
                  >
                    <View className="px-5 mt-6">
                      <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        Popular en {sec.categoryName}
                      </Text>
                    </View>
                    <ProductCarousel
                      items={sec.items}
                      className="mt-3"
                      cardWidth={160}
                    />
                  </View>
                ))}

                {/* Recommended (estático) */}
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
