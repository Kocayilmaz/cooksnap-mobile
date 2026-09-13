import { Text, View } from "react-native";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import type { RecipeSuggestion } from "@/lib/types/recipe";

/**
 * ne-pisirsem'deki RecipeMessageCard'ın sade karşılığı — video embed (YouTube)
 * bu ilk sürümde yok. Kopyalama/indirme/yıldızlama artık kart üzerinde değil,
 * ChatGPT'deki gibi mesajın altında tek bir eylem çubuğunda (bkz.
 * ChatMessageActions, app/(tabs)/chat.tsx).
 */
export default function RecipeMessageCard({ recipe }: { recipe: RecipeSuggestion }) {
  return (
    <View className="max-w-[92%] gap-2 self-start rounded-2xl border border-surface-border bg-surface-card p-4">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-foreground">{recipe.title}</Text>
        <Text className="text-xs text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
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
