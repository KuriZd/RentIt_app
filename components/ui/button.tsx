import React from "react";
import { Platform, Pressable, PressableProps, Text } from "react-native";

export type ButtonVariant = "primary" | "outline" | "ghost";

export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  className?: string;
  children?: React.ReactNode;
  label?: string;           // 👈 nuevo
  textClassName?: string;   // 👈 opcional para sobreescribir estilo del texto
}

export default function Button({
  variant = "primary",
  className = "",
  children,
  label,
  textClassName = "",
  onPress,
  ...props
}: ButtonProps) {
  const base =
    "h-14 rounded-2xl items-center justify-center transition-all duration-150";
  const webFx =
    Platform.OS === "web" ? "hover:translate-y-[1px] focus:outline-none" : "";

  const variants: Record<ButtonVariant, string> = {
    primary: [
      "bg-zinc-900 active:bg-black",
      "dark:bg-zinc-50 dark:active:bg-white",
      Platform.OS === "web" ? "hover:bg-black dark:hover:bg-white" : "",
    ].join(" "),
    outline: [
      "border border-zinc-300 bg-white/85",
      "dark:border-zinc-700 dark:bg-zinc-900/70",
      Platform.OS === "web" ? "hover:bg-zinc-50 dark:hover:bg-zinc-800" : "",
    ].join(" "),
    ghost: "bg-transparent dark:bg-transparent",
  };

  // Color de texto por variante (para cuando uses `label`)
  const textByVariant: Record<ButtonVariant, string> = {
    primary: "text-white dark:text-zinc-900",
    outline: "text-zinc-900 dark:text-zinc-100",
    ghost: "text-zinc-900 dark:text-zinc-100",
  };

  return (
    <Pressable
      accessibilityRole="button"
      className={`${base} ${webFx} ${variants[variant]} ${className}`}
      // 🧯 si necesitas pasar una función async: onPress={() => void handler()}
      onPress={onPress}
      {...props}
    >
      {label ? (
        <Text className={`${textByVariant[variant]} font-semibold ${textClassName}`}>
          {label}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
