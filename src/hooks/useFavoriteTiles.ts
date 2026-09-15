import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleFavorite } from "@/lib/redux/favoritesSlice";
import { toggleMealFavorite } from "@/lib/redux/mealFavoritesSlice";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { historyEntryTitle, summarizeHistoryEntry, toggleHistoryFavorite } from "@/lib/redux/historySlice";
import { getCategoryLabel } from "@/lib/mealdb/categoryMeta";

export interface FavoriteTile {
  /** "meal:<id>" / "recipe:<id>" / "chat:<id>" — koleksiyonlarda ve
   * EditFavoritesModal'da öğeleri ayırt etmek için kullanılan kompozit
   * anahtar (bkz. collectionsSlice). */
  key: string;
  kind: "meal" | "recipe" | "chat";
  title: string;
  subtitle: string;
  thumbnail: string | null;
  /** İlgili favori slice'ından kaldırır (kalp/yıldız'a tekrar basmakla aynı). */
  remove: () => void;
}

/** Üç farklı favori slice'ını (mealFavorites, favorites, history'nin
 * sabitlenenleri) tek, tutarlı bir liste haline getirir — Favorilerini
 * Düzenle ekranı ve koleksiyon akışları aynı öğe kümesini kullanıyor. */
export function useFavoriteTiles(): FavoriteTile[] {
  const dispatch = useAppDispatch();
  const mealFavorites = useAppSelector((state) => state.mealFavorites);
  const favorites = useAppSelector((state) => state.favorites);
  const history = useAppSelector((state) => state.history);

  const meals: FavoriteTile[] = Object.values(mealFavorites)
    .sort((a, b) => b.savedAt - a.savedAt)
    .map((meal) => ({
      key: `meal:${meal.id}`,
      kind: "meal",
      title: meal.name,
      subtitle: meal.category ? getCategoryLabel(meal.category) : "",
      thumbnail: meal.thumbnail,
      remove: () => dispatch(toggleMealFavorite(meal)),
    }));

  const recipes: FavoriteTile[] = Object.values(favorites)
    .sort((a, b) => b.savedAt - a.savedAt)
    .map((recipe) => ({
      key: `recipe:${recipe.id}`,
      kind: "recipe",
      title: recipe.title,
      subtitle: EQUIPMENT_LABELS[recipe.equipment],
      thumbnail: null,
      remove: () => dispatch(toggleFavorite(recipe)),
    }));

  const chats: FavoriteTile[] = history
    .filter((entry) => entry.isFavorite)
    .map((entry) => ({
      key: `chat:${entry.id}`,
      kind: "chat",
      title: historyEntryTitle(entry),
      subtitle: summarizeHistoryEntry(entry),
      thumbnail: null,
      remove: () => dispatch(toggleHistoryFavorite(entry.id)),
    }));

  return [...meals, ...recipes, ...chats];
}
