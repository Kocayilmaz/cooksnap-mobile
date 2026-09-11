import { Pressable, ScrollView, Text } from "react-native";
import { getCategoryLabel } from "@/lib/mealdb/categoryMeta";
import { Colors } from "@/constants/theme";
import type { MealCategory } from "@/lib/types/meal";

/** ne-pisirsem'deki CategoryNav.tsx'in mobil karşılığı — kategoriye
 * dokununca ilgili CategoryMealsSection'a kaydırır (bkz. app/(tabs)/index.tsx
 * scrollToCategory). */
export default function CategoryNav({
  categories,
  onSelect,
}: {
  categories: MealCategory[];
  onSelect: (categoryName: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4 }}
      contentContainerClassName="gap-2"
    >
      {categories.map((category) => (
        <Pressable
          key={category.name}
          onPress={() => onSelect(category.name)}
          style={{ borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: 16, paddingVertical: 8 }}
          className="rounded-full"
        >
          <Text className="text-sm font-medium text-foreground">{getCategoryLabel(category.name)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
