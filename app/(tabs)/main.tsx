import React, { useEffect, useState } from "react"; // 1. Importar useState y useEffect
import { ActivityIndicator, ScrollView, Text, View } from "react-native"; // 2. Importar ActivityIndicator
import BottomNav from "../../components/BottomNav";
import HeaderSearch from "../../components/HeaderSearch";
import ProductCarousel from "../../components/ProductCarousel";

// 3. Ya no necesitamos los arreglos estáticos (today, popularHome, recommended)
// ...los eliminamos.

export default function HomeScreen() {
  // 4. Definir los estados
  const [articulos, setArticulos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 5. URL de tu API (¡OJO CON ESTO!)
  // Si usas un emulador de Android, 'localhost' no funciona.
  // Debes usar la IP especial '10.0.2.2' para referirte al localhost de tu computadora.
  // Si estás en un simulador de iOS, 'http://localhost:5000' debería funcionar.
  // Si usas un dispositivo físico, usa la IP de tu PC en la red WiFi (ej: http://192.168.1.100:5000)
  const API_URL = "http://localhost:5000/api/articulos/";

  // 6. Hook useEffect para cargar los datos
  useEffect(() => {
    const fetchArticulos = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("La respuesta de la red no fue exitosa");
        }
        const data = await response.json();

        // 7. Mapear los datos de tu API al formato que espera ProductCarousel
        const articulosFormateados = data.map((item) => ({
          id: item.id.toString(), // El ID debe ser un string para el 'key'
          title: item.titulo, // 'titulo' de tu API -> 'title' del componente
          price: item.precio, // 'precio' de tu API -> 'price' del componente
          per: item.unidad_precio, // 'unidad_precio' -> 'per' del componente
          image: "http://bit.ly/4qoOoXG", // Placeholder, como pediste
        }));

        setArticulos(articulosFormateados); // Guardar los datos formateados
      } catch (error) {
        setError(error.message); // Guardar el error
      } finally {
        setIsLoading(false); // Dejar de cargar
      }
    };

    fetchArticulos();
  }, []); // El arreglo vacío '[]' asegura que esto solo se ejecute UNA VEZ

  // 8. Renderizar un indicador de carga mientras los datos llegan
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-2 text-neutral-900 dark:text-neutral-100">Cargando artículos...</Text>
      </View>
    );
  }

  // 9. Renderizar un mensaje de error si la llamada falló
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-red-500">Error al cargar: {error}</Text>
      </View>
    );
  }

  // 10. Renderizar la pantalla normal CON LOS DATOS DE LA API
  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header superior */}
      <HeaderSearch />

      {/* Contenido desplazable */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today selection */}
        <View className="px-5 pt-4">
          <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Today selection</Text>
        </View>
        {/* Usamos el estado 'articulos' */}
        <ProductCarousel items={articulos} className="mt-3" cardWidth={160} />

        {/* Popular for the home */}
        <View className="px-5 mt-6">
          <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Popular for the home</Text>
        </View>
        {/* Usamos el estado 'articulos' */}
        <ProductCarousel items={articulos} className="mt-3" cardWidth={160} />

        {/* Recommended for you */}
        <View className="px-5 mt-6 mb-4">
          <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Recommended for you</Text>
        </View>
        {/* Usamos el estado 'articulos' */}
        <ProductCarousel items={articulos} className="mt-3" cardWidth={160} />
      </ScrollView>

      {/*Barra de navegación inferior */}
      <BottomNav />
    </View>
  );
}
