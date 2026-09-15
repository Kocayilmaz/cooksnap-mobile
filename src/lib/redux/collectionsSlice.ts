import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Kullanıcı tanımlı koleksiyonlar — favorilenmiş tarifleri/sohbetleri kendi
 * gruplarında toplamak için (bkz. AddToCollectionSheet, favorites.tsx'teki
 * "Koleksiyonlar" sekmesi). Her öğe "meal:<id>" / "recipe:<id>" /
 * "chat:<id>" biçiminde kompozit bir anahtarla tutuluyor — hangi favori
 * slice'ından geldiğini ayırt etmek için (bkz. EditFavoritesModal'daki aynı
 * desen).
 */
export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  itemKeys: string[];
}

export type CollectionsState = Record<string, Collection>;

const initialState: CollectionsState = {};

const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    createCollection(state, action: PayloadAction<{ id: string; name: string }>) {
      state[action.payload.id] = {
        id: action.payload.id,
        name: action.payload.name,
        createdAt: Date.now(),
        itemKeys: [],
      };
    },
    renameCollection(state, action: PayloadAction<{ id: string; name: string }>) {
      const collection = state[action.payload.id];
      if (collection) collection.name = action.payload.name;
    },
    deleteCollection(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
    addItemToCollection(state, action: PayloadAction<{ collectionId: string; itemKey: string }>) {
      const collection = state[action.payload.collectionId];
      if (collection && !collection.itemKeys.includes(action.payload.itemKey)) {
        collection.itemKeys.push(action.payload.itemKey);
      }
    },
    removeItemFromCollection(state, action: PayloadAction<{ collectionId: string; itemKey: string }>) {
      const collection = state[action.payload.collectionId];
      if (collection) collection.itemKeys = collection.itemKeys.filter((key) => key !== action.payload.itemKey);
    },
    setCollections(_state, action: PayloadAction<CollectionsState>) {
      return action.payload;
    },
  },
});

export const {
  createCollection,
  renameCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
  setCollections,
} = collectionsSlice.actions;
export default collectionsSlice.reducer;
