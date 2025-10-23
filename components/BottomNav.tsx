// components/BottomNav.tsx
import { Feather } from "@expo/vector-icons";
import { usePathname, useRouter, type Href } from "expo-router";
import React from "react";
import { Platform, Pressable, Text, useColorScheme, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FeatherIconName = keyof typeof Feather.glyphMap;

export type NavItem = {
  key: string;
  label: string;
  icon: FeatherIconName;
  href: Href;
};

type Props = {
  activeKey?: string;
  onChange?: (key: string) => void;
  hideRoutes?: string[];
  safe?: boolean;
  style?: ViewStyle;
  className?: string;
  matchSubroutes?: boolean;
};

/** 🔹 Rutas reales */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { key: "profile",   label: "Profile",   icon: "user",  href: "/profile"    as const },
  { key: "favorites", label: "Favorites", icon: "heart", href: "/favorites" as const },
  { key: "home",      label: "Home",      icon: "home",  href: "/main"           as const },
  { key: "tickets",   label: "Tickets",   icon: "tag",   href: "/tickets"    as const },
  { key: "settings",  label: "Settings",  icon: "settings", href: "/settings" as const },
];

export default function BottomNav({
  activeKey,
  onChange,
  hideRoutes = [],
  safe = true,
  style,
  className = "",
  matchSubroutes = true,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();

  const items = DEFAULT_NAV_ITEMS.filter((i) => !hideRoutes.includes(i.key));
  const hrefToString = (href?: Href) => (typeof href === "string" ? href : href?.pathname ?? "");

  const isDark = theme === "dark";
  const bgColor = isDark ? "#09090b" : "#ffffff";
  const borderColor = isDark ? "#27272a" : "#e4e4e7";
  const textInactive = isDark ? "#a1a1aa" : "#1c1917";
  const iconInactive = textInactive;
  const activeColor = "#3B82F6";

  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: safe ? Math.max(insets.bottom, 8) : 8,
        },
        style,
      ]}
    >
      <View className="mx-4 flex-row items-center justify-between">
        {items.map((it) => {
          const hrefStr = hrefToString(it.href);
          const isActive = matchSubroutes ? pathname.startsWith(hrefStr) : pathname === hrefStr;

          const color = isActive ? activeColor : iconInactive;
          const textColor = isActive ? activeColor : textInactive;

          return (
            <Pressable
              key={it.key}
              accessibilityRole="button"
              accessibilityLabel={it.label}
              accessibilityState={{ selected: isActive }}
              className={[
                "flex-1 items-center py-1 active:opacity-80",
                Platform.OS === "web" ? "hover:opacity-90" : "",
              ].join(" ")}
              onPress={() => {
                router.push(it.href);
                onChange?.(it.key);
              }}
            >
              <Feather name={it.icon} size={22} color={color} />
              <Text
                className="mt-1 text-[11px]"
                style={{ color: textColor, fontWeight: isActive ? "600" : "400" }}
                numberOfLines={1}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
