import { Pressable, Text, View } from "react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setRecipeMode, RECIPE_MODE_KEYS, type RecipeMode } from "@/lib/redux/recipeModeSlice";

const MODE_LABELS: Record<RecipeMode, string> = {
  student: "Öğrenci",
  home: "Ev yemeği",
  chef: "Aşçı",
};

const MODE_DESCRIPTIONS: Record<RecipeMode, string> = {
  student: "En az bulaşık çıkaran, en kolay tarifler.",
  home: "Bulaşık kısıtı yok, en lezzetli bilindik ev yemekleri.",
  chef: "En lezzetli, elit/profesyonel şef tarifleri.",
};

export default function RecipeModeSelector() {
  const mode = useAppSelector((state) => state.recipeMode.value);
  const dispatch = useAppDispatch();

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">Tarif modu</Text>
      <View className="flex-row gap-2">
        {RECIPE_MODE_KEYS.map((key) => {
          const active = mode === key;
          return (
            <Pressable
              key={key}
              onPress={() => dispatch(setRecipeMode(key))}
              className={`rounded-full border px-4 py-2 ${active ? "border-brand-orange bg-brand-orange" : "border-surface-border"}`}
            >
              <Text className={`text-sm font-medium ${active ? "text-white" : "text-foreground"}`}>
                {MODE_LABELS[key]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-xs text-surface-text-muted">{MODE_DESCRIPTIONS[mode]}</Text>
    </View>
  );
}
