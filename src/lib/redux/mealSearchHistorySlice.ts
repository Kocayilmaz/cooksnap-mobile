import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MealSearchResult } from "@/lib/types/meal";

/** Hafızada tutulan en fazla geçmiş arama sayısı; bu sayı aşılınca en eski
 * arama (listenin sonu) unutulur — bkz. components/MealSearchBar.tsx. */
export const MAX_MEAL_SEARCH_HISTORY = 8;

export type MealSearchHistoryState = MealSearchResult[];

const initialState: MealSearchHistoryState = [];

const mealSearchHistorySlice = createSlice({
  name: "mealSearchHistory",
  initialState,
  reducers: {
    /** En başa ekler; aynı tarif zaten varsa eski kaydı kaldırıp öne alır. */
    addMealSearchHistoryEntry(state, action: PayloadAction<MealSearchResult>) {
      const withoutDuplicate = state.filter((entry) => entry.id !== action.payload.id);
      return [action.payload, ...withoutDuplicate].slice(0, MAX_MEAL_SEARCH_HISTORY);
    },
    setMealSearchHistory(_state, action: PayloadAction<MealSearchHistoryState>) {
      return action.payload;
    },
    clearMealSearchHistory() {
      return [];
    },
  },
});

export const { addMealSearchHistoryEntry, setMealSearchHistory, clearMealSearchHistory } =
  mealSearchHistorySlice.actions;
export default mealSearchHistorySlice.reducer;
