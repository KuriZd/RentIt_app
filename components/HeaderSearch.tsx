// components/HeaderSearch.tsx
import { Entypo, Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";

type Props = {
  onSearchPress?: () => void;
  onSellPress?: () => void;
  onCategoriesPress?: () => void;
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

const ripple = Platform.OS === "android" ? { android_ripple: { color: "#e5e5e5" as any } } : {};

export default function HeaderSearch({
  onSearchPress,
  onSellPress,
  onCategoriesPress,
}: Props) {
  return (
    <View className="px-5 pt-4 pb-3 bg-white dark:bg-transparent border-b border-neutral-200 dark:border-neutral-800">
      {/* Search pill */}
      <Pressable
        {...ripple}
        onPress={onSearchPress}
        className="flex-row items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-3"
        style={shadow}
        accessibilityRole="button"
        accessibilityLabel="Open search"
      >
        <Feather name="search" size={22} color="#525252" />
        <Text className="ml-2 text-base text-neutral-600 dark:text-neutral-300">
          Start the Search
        </Text>
      </Pressable>

      {/* Action pills */}
      <View className="flex-row gap-3 mt-3">
        {/* Sell */}
        <Link href="/(modals)/new-item" asChild>
          <Pressable
            {...ripple}
            onPress={onSellPress}
            className="flex-1 flex-row items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5"
            style={shadow}
            accessibilityRole="button"
            accessibilityLabel="Sell an item"
          >
            <View className="mr-2">
              <Entypo name="price-tag" size={20} color="#f5f5f5" />
            </View>
            <Text className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Sell
            </Text>
          </Pressable>
        </Link>

        {/* Categories */}
        <Link href="/categories" asChild>
          <Pressable
            {...ripple}
            onPress={onCategoriesPress}
            className="flex-1 flex-row items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5"
            style={shadow}
            accessibilityRole="button"
            accessibilityLabel="Open categories"
          >
            <View className="mr-2">
              <Feather name="menu" size={22} color="#f5f5f5" />
            </View>
            <Text className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Categories
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
