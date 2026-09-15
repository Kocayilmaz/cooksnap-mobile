import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Kullanıcı tanımlı koleksiyonlar — favorilenmiş tarifleri/sohbetleri kendi
 * gruplarında toplamak için (bkz. AddToCollectionSheet, favorites.tsx'teki
 * "Koleksiyonlar" sekmesi). Öğeler favorilerden BAĞIMSIZ olarak burada bir
 * anlık görüntü (snapshot) olarak tutuluyor — "Koleksiyona Ekle ve
 * Favorilerden Sil" seçildiğinde öğe favoriler slice'ından silinse de
 * koleksiyonda görünmeye devam etsin diye (bkz. CollectionDetailModal).
 * "key" alanı "meal:<id>" / "recipe:<id>" / "chat:<id>" biçiminde — hangi
 * favori slice'ından geldiğini ayırt etmek için (bkz. useFavoriteTiles).
 */
export interface CollectionItem {
  key: string;
  kind: "meal" | "recipe" | "chat";
  title: string;
  subtitle: string;
  thumbnail: string | null;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  items: CollectionItem[];
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
        items: [],
      };
    },
    renameCollection(state, action: PayloadAction<{ id: string; name: string }>) {
      const collection = state[action.payload.id];
      if (collection) collection.name = action.payload.name;
    },
    deleteCollection(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
    addItemToCollection(state, action: PayloadAction<{ collectionId: string; item: CollectionItem }>) {
      const collection = state[action.payload.collectionId];
      if (collection && !collection.items.some((existing) => existing.key === action.payload.item.key)) {
        collection.items.push(action.payload.item);
      }
    },
    removeItemFromCollection(state, action: PayloadAction<{ collectionId: string; itemKey: string }>) {
      const collection = state[action.payload.collectionId];
      if (collection) collection.items = collection.items.filter((item) => item.key !== action.payload.itemKey);
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
