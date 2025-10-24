import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

const slides = [
  {
    key: "rentit-welcome",
    title: "Bienvenido a RentIt",
    text: "Vende, renta y publica artículos ¡al instante! Todo cerca de ti y sin complicaciones.",
    img: require("../assets/onboarding/welcome.png"),
  },
  {
    key: "rentit-publish",
    title: "Publica en minutos",
    text: "Muestra tu artículo, establece el precio y marca cuándo está libre. ¡Tu anuncio está listo!",
    img: require("../assets/onboarding/publish.png"),
  },
  {
    key: "rentit-explore",
    title: "Explora y encuentra",
    text: "Tu compra ideal, simplificada: Navega por categorías, compara precios rápidamente y toma la mejor decisión.",
    img: require("../assets/onboarding/explore.png"),
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { title, text, img } = useMemo(() => slides[index], [index]);

  const goHome = async () => {
    await AsyncStorage.setItem("firstLaunchDone", "1");
    router.replace("/");
  };

  const next = () => (index < slides.length - 1 ? setIndex(index + 1) : goHome());
  const skip = () => goHome();

  return (
    <View className="flex-1 bg-white px-6 pt-16 pb-10 items-center justify-between">
      <View className="items-center">
        <Image
          source={img}
          style={{ width: 260, height: 320, borderRadius: 24 }}
          contentFit="contain"
          transition={200}
        />
        <Text className="text-5xl font-bold text-zinc-900 text-center mt-6">{title}</Text>
        <Text className="text-3xl text-zinc-600 text-justify max-w-[90%] font mt-10 leading-10">{text}</Text>
      </View>

      <View className="w-full">
        <View className="flex-row items-center justify-center mb-8">
          {slides.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full mx-1 ${
                i === index ? "bg-indigo-500 w-6" : "bg-zinc-300 w-2"
              }`}
            />
          ))}
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable onPress={skip}>
            <Text className="text-zinc-400 text-base">Omitir</Text>
          </Pressable>
          <Pressable
            onPress={next}
            className="bg-indigo-500 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">
              {index === slides.length - 1 ? "Comenzar" : "Siguiente"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
