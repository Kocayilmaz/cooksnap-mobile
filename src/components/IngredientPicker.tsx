import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Plus, Search, X } from "lucide-react-native";
import { ALL_INGREDIENTS, type MealIngredientEntry } from "@/lib/mealdb/ingredientList";
import { getIngredientLabel } from "@/lib/mealdb/ingredientMeta";
import { Colors } from "@/constants/theme";

const MIN_QUERY_LENGTH = 2;
const MAX_SEARCH_RESULTS = 60;

/** ne-pisirsem'deki IngredientPicker.tsx'in mobil karşılığı — aynı veri
 * (ALL_INGREDIENTS/getIngredientLabel), aynı "Tarifi Göster" -> /chat?ingredients=...
 * akışı. Varsayılan olarak gösterilen 10 popüler malzeme de web'le aynı. */
const POPULAR_INGREDIENT_NAMES = [
  "Onion",
  "Tomato",
  "Potatoes",
  "Chicken",
  "Eggs",
  "Cheese",
  "Green Pepper",
  "Aubergine",
  "Cucumber",
  "Carrots",
];

const INGREDIENTS_BY_NAME = new Map(ALL_INGREDIENTS.map((ing) => [ing.name, ing]));

const POPULAR_INGREDIENTS = POPULAR_INGREDIENT_NAMES.map((name) => INGREDIENTS_BY_NAME.get(name)).filter(
  (ing): ing is MealIngredientEntry => Boolean(ing),
);

export default function IngredientPicker() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) return null;
    return ALL_INGREDIENTS.filter(
      (ing) =>
        ing.name.toLowerCase().includes(trimmedQuery) ||
        getIngredientLabel(ing.name).toLowerCase().includes(trimmedQuery),
    ).slice(0, MAX_SEARCH_RESULTS);
  }, [trimmedQuery]);

  const visible = searchResults ?? POPULAR_INGREDIENTS;

  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function handleShowRecipe() {
    const text = selected.map(getIngredientLabel).join(", ");
    router.push({ pathname: "/chat", params: { ingredients: text } });
  }

  return (
    <View className="gap-5 rounded-2xl bg-surface-card p-6 shadow-sm">
      <View className="gap-1">
        <Text className="text-center text-xl font-semibold text-foreground">
          Evdeki malzemelerinizi seçin, size tarif önerelim
        </Text>
        <Text className="text-center text-sm text-surface-text-muted">
          Evinizdeki malzemeleri seçin, AI elinizdekilerle ne yapabileceğinizi önersin.
        </Text>
      </View>

      <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-warm px-4 py-2.5">
        <Search size={16} color={Colors.surfaceTextMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Başka bir malzeme ara…"
          placeholderTextColor={Colors.surfaceTextMuted}
          className="flex-1 text-sm text-foreground"
        />
      </View>

      {selected.length > 0 && (
        <View className="flex-row flex-wrap justify-center gap-2">
          {selected.map((name) => (
            <Pressable
              key={name}
              onPress={() => toggle(name)}
              style={{ backgroundColor: "rgba(242, 96, 12, 0.1)", paddingHorizontal: 12, paddingVertical: 4 }}
              className="flex-row items-center gap-1 rounded-full"
            >
              <Text className="text-xs font-medium text-brand-orange">{getIngredientLabel(name)}</Text>
              <X size={12} color={Colors.brandOrange} />
            </Pressable>
          ))}
        </View>
      )}

      {searchResults && searchResults.length === 0 ? (
        <Text className="text-center text-sm text-surface-text-muted">
          &quot;{query.trim()}&quot; için malzeme bulunamadı.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
          contentContainerClassName="gap-3"
        >
          {visible.map((ing) => {
            const isSelected = selected.includes(ing.name);
            const label = getIngredientLabel(ing.name);
            return (
              <Pressable
                key={ing.name}
                onPress={() => toggle(ing.name)}
                style={{ width: 64 }}
                className="items-center gap-1.5"
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: isSelected ? Colors.brandOrange : "transparent",
                  }}
                  className="rounded-xl bg-surface-warm"
                >
                  <Image source={{ uri: ing.thumb }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  <View
                    style={{ position: "absolute", bottom: 4, right: 4, height: 24, width: 24 }}
                    className={`items-center justify-center rounded-full ${
                      isSelected ? "bg-brand-orange" : "bg-surface-card"
                    }`}
                  >
                    {isSelected ? (
                      <X size={14} color="#ffffff" />
                    ) : (
                      <Plus size={14} color={Colors.foreground} />
                    )}
                  </View>
                </View>
                <Text numberOfLines={1} className="text-xs text-foreground">
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Pressable
        onPress={handleShowRecipe}
        disabled={selected.length === 0}
        style={{ alignSelf: "center" }}
        className={`items-center rounded-full px-6 py-3 ${selected.length === 0 ? "bg-surface-border" : "bg-brand-red"}`}
      >
        <Text className={`text-sm font-semibold ${selected.length === 0 ? "text-surface-text-muted" : "text-white"}`}>
          Tarifi Göster
        </Text>
      </Pressable>
    </View>
  );
}
