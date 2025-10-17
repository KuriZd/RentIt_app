import React from "react";
import { Platform, Pressable, PressableProps } from "react-native";

export type ButtonVariant = "primary" | "outline" | "ghost";

export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  className?: string;
  children?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "h-14 rounded-2xl items-center justify-center transition-all duration-150";
  const webFx =
    Platform.OS === "web" ? "hover:translate-y-[1px] focus:outline-none" : "";
  const variants: Record<ButtonVariant, string> = {
    primary: [
      "bg-zinc-900 text-white active:bg-black",
      "dark:bg-zinc-50 dark:text-zinc-900 dark:active:bg-white",
      Platform.OS === "web" ? "hover:bg-black dark:hover:bg-white" : "",
    ].join(" "),
    outline: [
      "border border-zinc-300 text-zinc-900 bg-white/85",
      "dark:border-zinc-700 dark:text-zinc-100 dark:bg-zinc-900/70",
      Platform.OS === "web" ? "hover:bg-zinc-50 dark:hover:bg-zinc-800" : "",
    ].join(" "),
    ghost: "bg-transparent dark:bg-transparent",
  };

  return (
    <Pressable
      accessibilityRole="button"
      className={`${base} ${webFx} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Pressable>
  );
}
