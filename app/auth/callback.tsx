import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AuthCallbackScreen() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/main");
    }, [router]);

    return (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
        </View>
    );
}
