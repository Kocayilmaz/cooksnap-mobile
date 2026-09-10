import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Clock, MessageCircle, Star } from "lucide-react-native";
import { Pressable } from "react-native";
import { useAppSelector } from "@/lib/redux/hooks";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";

const RECENT_PREVIEW_COUNT = 3;

/**
 * ne-pisirsem'deki HomeWelcomeSection'ın sade mobil karşılığı — yüzen yemek
 * fotoğrafları (FloatingFoodHero) burada yok, o tamamen dekoratif ve görsel
 * assetleri mobil projeye taşımak ayrı bir iş; metin/CTA/son aramalar ve
 * favoriler aynı Redux verisiyle birebir çalışıyor.
 */
export default function HomeScreen() {
  const router = useRouter();
  const isLoggedIn = useAppSelector((state) => state.auth.status === "authenticated");
  const storedName = useAppSelector((state) => state.userProfile.name);
  const name = isLoggedIn ? storedName : "";
  const history = useAppSelector((state) => state.history);
  const favorites = useAppSelector((state) => state.favorites);

  const recentHistory = history.slice(0, RECENT_PREVIEW_COUNT);
  const recentFavorites = Object.values(favorites)
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, RECENT_PREVIEW_COUNT);

  return (
    <ScrollView className="flex-1 bg-surface-warm" contentContainerClassName="gap-6 p-4 pb-10">
      <View className="gap-4 rounded-2xl bg-brand-red p-6">
        <Text className="text-3xl font-bold text-white">CookSnap</Text>
        <Text className="text-base text-white/90">
          {name ? `Merhaba, ${name}!` : "Merhaba!"} Dolabındaki malzemelerin fotoğrafını çek, öğrenci/ev
          yemeği/aşçı modundan birini seç, AI saniyeler içinde tarifini çıkarsın.
        </Text>
        <Pressable
          onPress={() => router.push("/chat")}
          className="flex-row items-center gap-2 self-start rounded-full bg-white px-5 py-3"
        >
          <MessageCircle size={18} color="#e8272b" />
          <Text className="text-sm font-semibold text-brand-red">Sohbete Başla</Text>
        </Pressable>
      </View>

      {recentHistory.length > 0 && (
        <View className="gap-2 rounded-2xl bg-surface-card p-5 shadow-sm">
          <View className="flex-row items-center gap-1.5">
            <Clock size={16} color="#171717" />
            <Text className="text-sm font-medium text-foreground">Son aramaların</Text>
          </View>
          <View className="gap-2">
            {recentHistory.map((entry) => (
              <View key={entry.id} className="rounded-lg border border-surface-border px-3 py-2">
                <Text className="text-xs text-foreground">
                  {entry.recipeTitles.length > 0
                    ? entry.recipeTitles.join(", ")
                    : `${entry.equipment.map((key) => EQUIPMENT_LABELS[key]).join(", ")} · ${entry.personCount} kişilik`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {recentFavorites.length > 0 && (
        <View className="gap-2 rounded-2xl bg-surface-card p-5 shadow-sm">
          <View className="flex-row items-center gap-1.5">
            <Star size={16} color="#171717" />
            <Text className="text-sm font-medium text-foreground">Favori tariflerin</Text>
          </View>
          <View className="gap-2">
            {recentFavorites.map((recipe) => (
              <View key={recipe.id} className="rounded-lg border border-surface-border px-3 py-2">
                <Text className="text-xs text-foreground">
                  {recipe.title} <Text className="text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
