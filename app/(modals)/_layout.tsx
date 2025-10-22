import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="new-item"
        options={{
          presentation: "modal",
          title: "Nueva publicación",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
