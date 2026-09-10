import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Equipment } from "./equipmentSlice";

export interface FavoriteRecipe {
  id: string;
  title: string;
  equipment: Equipment;
  steps: string[];
  videoId?: string | null;
  savedAt: number;
}

export type FavoritesState = Record<string, FavoriteRecipe>;

const initialState: FavoritesState = {};

/** Tarifin kendi id'si olmadığı için ekipman+başlık ikilisi kimlik olarak kullanılıyor. */
export function makeFavoriteId(equipment: Equipment, title: string): string {
  return `${equipment}::${title}`;
}

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<Omit<FavoriteRecipe, "savedAt">>) {
      const { id } = action.payload;
      if (state[id]) {
        delete state[id];
      } else {
        state[id] = { ...action.payload, savedAt: Date.now() };
      }
    },
    setFavorites(_state, action: PayloadAction<FavoritesState>) {
      return action.payload;
    },
  },
});

export const { toggleFavorite, setFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
