// app/Onboarding.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ArtPublish, ArtSearch, ArtSecure } from "../components/Artworks";

const slides = [
  { key: "rentit-welcome", title: "Bienvenido a RentIt", text: "Renta o publica artículos cerca de ti de forma sencilla.", Art: ArtPublish },
  { key: "rentit-explore",  title: "Explora y encuentra", text: "Busca por categoría, compara y elige lo que necesitas.", Art: ArtSearch  },
  { key: "rentit-safe",     title: "Seguro y confiable",  text: "Verifica perfiles, califica y renta con tranquilidad.",  Art: ArtSecure  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { title, text, Art } = useMemo(() => slides[index], [index]);

  const goHome = async () => {
    await AsyncStorage.setItem("firstLaunchDone", "1"); 
    router.replace("/");                    
  };

  const next = () => (index < slides.length - 1 ? setIndex(index + 1) : goHome());
  const skip = () => goHome();

  return (
    <View className="flex-1 bg-white px-6 pt-16 pb-10 items-center justify-between">
      <View className="items-center">
        <Art size={260} />
        <Text className="text-2xl font-bold text-zinc-900 text-center mt-6">{title}</Text>
        <Text className="text-base text-zinc-600 text-center mt-3 leading-6">{text}</Text>
      </View>

      <View className="w-full">
        <View className="flex-row items-center justify-center mb-8">
          {slides.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full mx-1 ${i === index ? "bg-indigo-500 w-6" : "bg-zinc-300 w-2"}`}
            />
          ))}
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable onPress={skip}><Text className="text-zinc-400 text-base">Omitir</Text></Pressable>
          <Pressable onPress={next} className="bg-indigo-500 px-6 py-3 rounded-full">
            <Text className="text-white font-semibold">{index === slides.length - 1 ? "Comenzar" : "Siguiente"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
