import { ScrollView, Text, View, Pressable } from "react-native";
import { Star } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleFavorite } from "@/lib/redux/favoritesSlice";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { historyEntryTitle, summarizeHistoryEntry, toggleHistoryFavorite } from "@/lib/redux/historySlice";
import { Colors } from "@/constants/theme";

/**
 * ne-pisirsem'deki app/favorites/page.tsx'in mobil karşılığı — aynı ayrım:
 * "Tarif Favorileri" (chat'te üretilen, yıldızlanan tarifler) ile
 * "Sohbet Favorileri" (sabitlenen konuşmalar) ayrı bölümler. Web'deki
 * "Kaydedilen Tarifler" (MealDB) bölümü burada yok — mobilde henüz yemek
 * arama/kategori taraması eklenmedi. Sohbet favorisine dokununca ilgili
 * sohbeti yeniden açma (web'deki /chat?entryId=...) da henüz yok.
 */
export default function FavoritesScreen() {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites);
  const history = useAppSelector((state) => state.history);

  const allRecipes = Object.values(favorites).sort((a, b) => b.savedAt - a.savedAt);
  const favoriteChats = history.filter((entry) => entry.isFavorite);

  return (
    <ScrollView className="flex-1 bg-surface-warm" contentContainerClassName="gap-6 p-4 pb-10">
      <Text className="text-center text-2xl font-bold text-brand-red">Favoriler</Text>

      <View className="gap-3 rounded-2xl bg-surface-card p-5 shadow-sm">
        <Text className="text-sm font-semibold text-foreground">Tarif Favorileri</Text>
        {allRecipes.length === 0 ? (
          <Text className="text-center text-sm text-surface-text-muted">
            Henüz favori tarifin yok. Chat&apos;ten bir tarif alıp yıldıza basarak ekleyebilirsin.
          </Text>
        ) : (
          <View className="gap-3">
            {allRecipes.map((recipe) => (
              <View key={recipe.id} className="rounded-xl border border-surface-border p-3">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-foreground">{recipe.title}</Text>
                    <Text className="text-xs text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
                  </View>
                  <Pressable onPress={() => dispatch(toggleFavorite(recipe))} hitSlop={8}>
                    <Star size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {favoriteChats.length > 0 && (
        <View className="gap-3 rounded-2xl bg-surface-card p-5 shadow-sm">
          <Text className="text-sm font-semibold text-foreground">Sohbet Favorileri</Text>
          <Text className="text-xs text-surface-text-muted">
            Sohbet geçmişinde sabitlediğin konuşmalar — yukarıdaki tarif favorilerinden ayrı.
          </Text>
          <View className="gap-2">
            {favoriteChats.map((entry) => (
              <View key={entry.id} className="flex-row items-center justify-between gap-2 rounded-xl border border-surface-border p-3">
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-foreground">{historyEntryTitle(entry)}</Text>
                  <Text className="text-xs text-surface-text-muted">{summarizeHistoryEntry(entry)}</Text>
                </View>
                <Pressable onPress={() => dispatch(toggleHistoryFavorite(entry.id))} hitSlop={8}>
                  <Star size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
