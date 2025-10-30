import { Entypo, Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, Text, View, useColorScheme } from "react-native";
import CategoriesSheet, { Category } from "../app/(modals)/categories";
import NewItemSheet from "../app/(modals)/new-item";

const CATEGORIES: Category[] = [
  { key: "vehicles", label: "Vehicles", icon: "car-outline" },
  { key: "properties", label: "Properties", icon: "home-city-outline" },
  { key: "hobbies", label: "Hobbies", icon: "palette-outline" },
  { key: "sports", label: "Sports equipment", icon: "basketball" },
  { key: "freebies", label: "Freebies", icon: "gift-outline" },
  { key: "household", label: "Household goods", icon: "sofa-outline" },
  { key: "electronics", label: "Electronics", icon: "cellphone-link" },
  { key: "entertainment", label: "Entertainment", icon: "movie-open-outline" },
  { key: "family", label: "Family", icon: "account-group-outline" },
  { key: "realestate", label: "Real estate", icon: "office-building-outline" },
  { key: "garden", label: "Garden and outdoors", icon: "flower-outline" },
  { key: "tools", label: "Tools", icon: "tools" },
  { key: "games", label: "Games and toys", icon: "puzzle-outline" },
  { key: "office", label: "Office supplies", icon: "briefcase-outline" },
  { key: "clothes", label: "Clothes", icon: "tshirt-crew-outline" },
  { key: "pets", label: "Pet supplies", icon: "paw" },
  { key: "renovation", label: "Renovation supplies", icon: "hammer-wrench" },
  { key: "others", label: "Others", icon: "dots-horizontal-circle-outline" },
];

type Props = {
  onSearchPress?: () => void;
  onSellPress?: () => void;
  onCategorySelected?: (cat: Category) => void;
};

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
});
const ripple =
  Platform.OS === "android"
    ? { android_ripple: { color: "#e5e5e5" as any } }
    : {};

export default function HeaderSearch({
  onSearchPress,
  onSellPress,
  onCategorySelected,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [showCategories, setShowCategories] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);

  const COLORS = useMemo(
    () => ({
      pill: isDark ? "#27272a" : "#f3f4f6",
      icon: isDark ? "#e5e7eb" : "#111827",
      text: isDark ? "#fafafa" : "#111827",
      subtext: isDark ? "#a1a1aa" : "#52525b",
    }),
    [isDark]
  );

  return (
    <>
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-transparent border-b border-neutral-200 dark:border-neutral-800">
        {/* Search pill */}
        <Pressable
          {...ripple}
          onPress={onSearchPress}
          className="flex-row items-center rounded-full px-4 py-3"
          style={[shadow, { backgroundColor: COLORS.pill }]}
        >
          <Feather name="search" size={22} color={COLORS.icon} />
          <Text className="ml-2 text-base" style={{ color: COLORS.subtext }}>
            Start the Search
          </Text>
        </Pressable>

        {/* Action pills */}
        <View className="flex-row gap-3 mt-3">
          {/* Sell */}
          <Pressable
            {...ripple}
            onPress={() => setShowNewItem(true)}
            className="flex-1 flex-row items-center justify-center rounded-full px-4 py-2.5"
            style={[shadow, { backgroundColor: COLORS.pill }]}
          >
            <View className="mr-2">
              <Entypo name="price-tag" size={20} color={COLORS.icon} />
            </View>
            <Text
              className="text-lg font-medium"
              style={{ color: COLORS.text }}
            >
              Sell
            </Text>
          </Pressable>

          {/* Categories */}
          <Pressable
            {...ripple}
            onPress={() => setShowCategories(true)}
            className="flex-1 flex-row items-center justify-center rounded-full px-4 py-2.5"
            style={[shadow, { backgroundColor: COLORS.pill }]}
          >
            <View className="mr-2">
              <Feather name="menu" size={22} color={COLORS.icon} />
            </View>
            <Text
              className="text-lg font-medium"
              style={{ color: COLORS.text }}
            >
              Categories
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Modal desglosado */}
      <CategoriesSheet
        visible={showCategories}
        onClose={() => setShowCategories(false)}
        data={CATEGORIES}
        onSelect={onCategorySelected}
      />

       {/* New Item Sheet */}
      <NewItemSheet
        visible={showNewItem}
        onClose={() => setShowNewItem(false)}
        onPublish={async (payload) => {
          // Aquí conectas a Supabase alexis
          
          console.log("Publishing item:", payload);
        }}
      />
    </>
  );
}
