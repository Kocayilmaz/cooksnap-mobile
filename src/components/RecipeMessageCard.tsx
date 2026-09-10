import { Pressable, Text, View } from "react-native";
import { Star } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { makeFavoriteId, toggleFavorite } from "@/lib/redux/favoritesSlice";
import { Colors } from "@/constants/theme";
import type { RecipeSuggestion } from "@/lib/types/recipe";

/**
 * ne-pisirsem'deki RecipeMessageCard'ın sade karşılığı — video embed (YouTube)
 * ve "kopyala" butonu bu ilk sürümde yok (webview/clipboard entegrasyonu
 * ayrı bir iş), yıldızla favorileme (favoritesSlice) aynı davranışta.
 */
export default function RecipeMessageCard({ recipe }: { recipe: RecipeSuggestion }) {
  const dispatch = useAppDispatch();
  const id = makeFavoriteId(recipe.equipment, recipe.title);
  const isFavorite = useAppSelector((state) => Boolean(state.favorites[id]));

  return (
    <View className="max-w-[92%] gap-2 self-start rounded-2xl border border-surface-border bg-surface-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground">{recipe.title}</Text>
          <Text className="text-xs text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
        </View>
        <Pressable
          onPress={() =>
            dispatch(toggleFavorite({ id, title: recipe.title, equipment: recipe.equipment, steps: recipe.steps, videoId: recipe.videoId }))
          }
          hitSlop={8}
        >
          <Star size={18} color={Colors.brandOrange} fill={isFavorite ? Colors.brandOrange : "none"} />
        </Pressable>
      </View>
      <View className="gap-1">
        {recipe.steps.map((step, index) => (
          <Text key={index} className="text-sm text-surface-text-muted">
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    </View>
  );
}
