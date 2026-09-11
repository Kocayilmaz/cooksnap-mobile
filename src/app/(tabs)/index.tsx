import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Clock, MessageCircle, Star } from "lucide-react-native";
import { useAppSelector } from "@/lib/redux/hooks";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { getCategoryLabel } from "@/lib/mealdb/categoryMeta";
import { getHomeMealSections, type MealHomeSection } from "@/lib/api/client";
import { Colors } from "@/constants/theme";
import IngredientPicker from "@/components/IngredientPicker";
import CategoryNav from "@/components/CategoryNav";
import MealCard from "@/components/MealCard";
import type { MealCategory } from "@/lib/types/meal";

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

  // Kategori bölümü — ne-pisirsem'in app/page.tsx'teki server-side veri
  // birleştirmesini (kendi Firestore tarifleri + TheMealDB + Spoonacular)
  // ortak /api/meals/home-sections endpoint'inden tek istekle çekiyor (bkz.
  // ne-pisirsem app/api/meals/home-sections/route.ts).
  const [categories, setCategories] = useState<MealCategory[]>([]);
  const [sections, setSections] = useState<MealHomeSection[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    getHomeMealSections()
      .then((data) => {
        if (!isMounted) return;
        setCategories(data.categories);
        setSections(data.sections.filter((section) => section.meals.length > 0));
      })
      .catch(() => {
        // best-effort — kategori bölümü olmadan da anasayfa kullanılabilir kalır.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function scrollToCategory(categoryName: string) {
    const y = sectionOffsets.current[categoryName];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
      <ScrollView ref={scrollViewRef} contentContainerClassName="gap-6 p-4 pb-10">
        <LinearGradient
          colors={[Colors.brandOrange, Colors.brandRed]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            alignItems: "center",
            overflow: "hidden",
            gap: 24,
            paddingHorizontal: 28,
            paddingTop: 36,
            paddingBottom: 56,
          }}
        >
          <Text className="text-3xl font-bold text-white">CookSnap</Text>
          <Text className="text-center text-base text-white/90">
            {name ? `Merhaba, ${name}!` : "Merhaba!"} Dolabındaki malzemelerin fotoğrafını çek, öğrenci/ev
            yemeği/aşçı modundan birini seç, AI saniyeler içinde tarifini çıkarsın.
          </Text>
          <Pressable
            onPress={() => router.push("/chat")}
            className="flex-row items-center gap-2 rounded-full bg-white px-5 py-3"
          >
            <MessageCircle size={18} color={Colors.brandRed} />
            <Text className="text-sm font-semibold text-brand-red">Sohbete Başla</Text>
          </Pressable>
        </LinearGradient>

        <IngredientPicker />

        {categories.length > 0 && (
          <View className="gap-4">
            <CategoryNav categories={categories} onSelect={scrollToCategory} />

            {sections.map((section) => (
              <View
                key={section.categoryName}
                onLayout={(event) => {
                  sectionOffsets.current[section.categoryName] = event.nativeEvent.layout.y;
                }}
                className="gap-3"
              >
                <Text className="text-lg font-semibold text-foreground">
                  {getCategoryLabel(section.categoryName)}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 4 }}
                  contentContainerClassName="gap-3"
                >
                  {section.meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        )}

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
    </SafeAreaView>
  );
}
