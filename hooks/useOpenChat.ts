// hooks/useOpenChat.ts
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { supabase } from "../utils/supabase";

function buildRoomId(a: string, b: string) {
    // ordenamos para que sea igual para ambos usuarios
    return [a, b].sort().join(":");
}

export function useOpenChat() {
    const router = useRouter();

    const openChatWithUser = async (otherProfileId: string) => {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
            Alert.alert(
                "Inicia sesión",
                "Debes iniciar sesión para enviar mensajes."
            );
            return;
        }

        const myId = data.user.id; // uid del usuario autenticado (auth.users.id)
        const roomId = buildRoomId(myId, otherProfileId); // perfiles.id del otro

        router.push({
            pathname: "/messages/[id]",
            params: { id: roomId },
        });
    };

    return { openChatWithUser };
}
