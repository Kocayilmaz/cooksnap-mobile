import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MealSearchResult } from "@/lib/types/meal";

export interface MealFavorite extends MealSearchResult {
  savedAt: number;
}

/** TheMealDB'den favorilenen tarifler — AI-tarif akışının kendi favorileri
 * (favoritesSlice.ts) ile karışmasın diye ayrı tutuluyor, o slice `equipment`
 * gibi AI-akışına özel alanlar bekliyor. Favoriler sayfasında ikisi de
 * ayrı bölümler halinde gösteriliyor (bkz. app/favorites/page.tsx). */
export type MealFavoritesState = Record<string, MealFavorite>;

const initialState: MealFavoritesState = {};

const mealFavoritesSlice = createSlice({
  name: "mealFavorites",
  initialState,
  reducers: {
    toggleMealFavorite(state, action: PayloadAction<MealSearchResult>) {
      const { id } = action.payload;
      if (state[id]) {
        delete state[id];
      } else {
        state[id] = { ...action.payload, savedAt: Date.now() };
      }
    },
    setMealFavorites(_state, action: PayloadAction<MealFavoritesState>) {
      return action.payload;
    },
  },
});

export const { toggleMealFavorite, setMealFavorites } = mealFavoritesSlice.actions;
export default mealFavoritesSlice.reducer;
