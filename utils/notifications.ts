// utils/notifications.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // todavía lo puedes dejar por compatibilidad
    shouldShowAlert: true,

    // nuevos flags que ahora son requeridos por el tipo
    shouldShowBanner: true, // se muestra como banner (iOS)
    shouldShowList: true,   // aparece en el Notification Center / lista

    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Debes usar un dispositivo físico para recibir push.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("No se concedieron permisos de notificaciones");
    return null;
  }

  // Si tu proyecto usa EAS con projectId, y esto te da error,
  // luego podemos pasar el projectId aquí.
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo push token:", token);

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: data ?? {},
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}