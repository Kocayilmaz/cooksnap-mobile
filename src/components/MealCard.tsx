import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { getCategoryLabel } from "@/lib/mealdb/categoryMeta";
import { getAreaLabel } from "@/lib/mealdb/areaMeta";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleMealFavorite } from "@/lib/redux/mealFavoritesSlice";
import { Colors } from "@/constants/theme";
import type { MealSearchResult } from "@/lib/types/meal";

/** ne-pisirsem'deki components/MealCard.tsx'in mobil karşılığı — yatay
 * kaydırmalı kategori sıralarında sabit genişlikte (bkz. CategoryMealsSection). */
export default function MealCard({ meal }: { meal: MealSearchResult }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isFavorited = useAppSelector((state) => Boolean(state.mealFavorites[meal.id]));
  const badgeLabel = meal.category ? getCategoryLabel(meal.category) : meal.area ? getAreaLabel(meal.area) : "";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/meal/[id]", params: { id: meal.id } })}
      style={{ width: 144 }}
    >
      <View style={{ overflow: "hidden" }} className="rounded-xl bg-surface-card shadow-sm">
        <View style={{ aspectRatio: 4 / 3 }}>
          <Image source={{ uri: meal.thumbnail }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          <Pressable
            onPress={() => dispatch(toggleMealFavorite(meal))}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              height: 32,
              width: 32,
              backgroundColor: "rgba(255,255,255,0.85)",
            }}
            className="items-center justify-center rounded-full"
          >
            <Heart size={16} color={Colors.brandOrange} fill={isFavorited ? Colors.brandOrange : "none"} />
          </Pressable>
          {badgeLabel && (
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: Colors.brandOrange,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text className="text-xs font-medium text-white">{badgeLabel}</Text>
            </View>
          )}
        </View>

        <View className="gap-1 p-2">
          <Text numberOfLines={2} className="text-sm font-medium text-foreground">
            {meal.name}
          </Text>
          {meal.area && <Text className="text-xs text-surface-text-muted">{getAreaLabel(meal.area)}</Text>}
          <Text className="text-xs font-medium text-brand-orange">Tarifi Gör →</Text>
        </View>
      </View>
    </Pressable>
  );
}
