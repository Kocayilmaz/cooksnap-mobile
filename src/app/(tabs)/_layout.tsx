import { Tabs } from "expo-router";
import { ChefHat, Heart, House } from "lucide-react-native";
import { Colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brandOrange,
        tabBarInactiveTintColor: Colors.surfaceTextMuted,
        tabBarStyle: { backgroundColor: Colors.surfaceCard, borderTopColor: Colors.surfaceBorder },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Anasayfa", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Chat", tabBarIcon: ({ color, size }) => <ChefHat color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: "Favoriler", tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }}
      />
    </Tabs>
  );
}
