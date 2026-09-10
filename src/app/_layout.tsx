import "@/global.css";

import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import AppProviders from "@/components/AppProviders";
import { useAppSelector } from "@/lib/redux/hooks";

/**
 * ne-pisirsem'deki AuthGate.tsx'in mobil karşılığı — Expo Router'ın
 * Stack.Protected'ı (bkz. https://docs.expo.dev/router/advanced/protected/)
 * ile login/(tabs) arasında geçişi bildirimsel (guard prop'uyla) yönetiyor,
 * elle router.replace çağırmaya gerek kalmıyor.
 */
function RootNavigation() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const isGuest = useAppSelector((state) => state.guestMode.isGuest);
  const isKnown = authStatus !== "loading";
  const isLoggedIn = authStatus === "authenticated" || isGuest;

  if (!isKnown) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-warm">
        <ActivityIndicator size="large" color="#f2600c" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigation />
    </AppProviders>
  );
}
