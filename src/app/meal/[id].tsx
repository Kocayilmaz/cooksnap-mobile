import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart, PlayCircle, Share2 } from "lucide-react-native";
import { getMealDetail } from "@/lib/api/client";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleMealFavorite } from "@/lib/redux/mealFavoritesSlice";
import AddToCollectionSheet from "@/components/AddToCollectionSheet";
import { Colors } from "@/constants/theme";
import type { MealDetail } from "@/lib/types/meal";

/**
 * ne-pisirsem'deki app/meal/[id]/page.tsx'in mobil karşılığı — kendi
 * Firestore / Spoonacular / TheMealDB çözümlemesi ve Türkçe çeviri ortak
 * /api/meals/detail endpoint'inde (bkz. ne-pisirsem app/api/meals/detail/route.ts).
 * YouTube videosu embed edilmiyor (react-native-webview henüz yok) — bunun
 * yerine tarayıcıda açan bir buton var.
 */
export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isFavorited = useAppSelector((state) => Boolean(state.mealFavorites[id]));
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getMealDetail(id)
      .then((data) => {
        if (isMounted) setMeal(data);
      })
      .catch(() => {
        if (isMounted) setError("Tarif yüklenemedi.");
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleShare() {
    if (!meal) return;
    try {
      await Share.share({ message: `${meal.name}\n${[meal.category, meal.area].filter(Boolean).join(" · ")}` });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-warm">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-1.5">
            <ArrowLeft size={16} color={Colors.surfaceTextMuted} />
            <Text className="text-sm font-medium text-surface-text-muted">Geri</Text>
          </Pressable>

          {meal && (
            <View className="flex-row items-center gap-4">
              <Pressable onPress={handleShare} hitSlop={8}>
                <Share2 size={19} color={Colors.surfaceTextMuted} />
              </Pressable>
              <Pressable
                onPress={() => dispatch(toggleMealFavorite(meal))}
                onLongPress={() => {
                  // Koleksiyona eklenen bir tarif useFavoriteTiles üzerinden
                  // çözülüyor, o da yalnızca favorilenmiş öğeleri görüyor —
                  // bu yüzden koleksiyona eklemeden önce favorilemesi gerekiyor.
                  if (!isFavorited) dispatch(toggleMealFavorite(meal));
                  setIsAddToCollectionOpen(true);
                }}
                hitSlop={8}
              >
                <Heart size={20} color={Colors.brandOrange} fill={isFavorited ? Colors.brandOrange : "none"} />
              </Pressable>
            </View>
          )}
        </View>

        {!meal && !error && (
          <View style={{ paddingVertical: 48 }} className="items-center">
            <ActivityIndicator color={Colors.brandOrange} />
          </View>
        )}

        {error && <Text className="text-center text-sm text-state-error">{error}</Text>}

        {meal && (
          <>
            <View style={{ aspectRatio: 4 / 3, overflow: "hidden", borderRadius: 16 }}>
              <Image source={{ uri: meal.thumbnail }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            </View>

            <View className="gap-1">
              <Text className="text-2xl font-semibold text-brand-red">{meal.name}</Text>
              <Text className="text-sm text-surface-text-muted">
                {[meal.category, meal.area].filter(Boolean).join(" · ")}
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Malzemeler</Text>
              <View className="gap-1">
                {meal.ingredients.map((ingredient) => (
                  <Text key={ingredient.name} className="text-sm text-surface-text-muted">
                    {ingredient.measure ? `${ingredient.measure} ` : ""}
                    {ingredient.name}
                  </Text>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Hazırlanışı</Text>
              <Text className="text-sm text-surface-text-muted">{meal.instructions}</Text>
            </View>

            {meal.youtubeVideoId && (
              <Pressable
                onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${meal.youtubeVideoId}`)}
                className="flex-row items-center gap-2 self-start rounded-full bg-brand-red px-5 py-3"
              >
                <PlayCircle size={18} color="#ffffff" />
                <Text className="text-sm font-semibold text-white">YouTube&apos;da izle</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      {meal && (
        <AddToCollectionSheet
          visible={isAddToCollectionOpen}
          onClose={() => setIsAddToCollectionOpen(false)}
          items={[{ key: `meal:${meal.id}`, removeFromFavorites: () => dispatch(toggleMealFavorite(meal)) }]}
        />
      )}
    </SafeAreaView>
  );
}
