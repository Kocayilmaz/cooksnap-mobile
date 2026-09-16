import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type RecipeLanguage = "tr" | "en";

interface UserProfileState {
  name: string;
  language: RecipeLanguage;
  country: string;
  /** Kullanıcının galeriden seçtiği profil fotoğrafı (data URI olarak) —
   * yoksa profil ekranı isim baş harflerinden bir avatar gösterir. */
  photoUri: string | null;
}

const initialState: UserProfileState = {
  name: "",
  language: "tr",
  country: "",
  photoUri: null,
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setLanguage(state, action: PayloadAction<RecipeLanguage>) {
      state.language = action.payload;
    },
    setCountry(state, action: PayloadAction<string>) {
      state.country = action.payload;
    },
    setPhotoUri(state, action: PayloadAction<string | null>) {
      state.photoUri = action.payload;
    },
  },
});

export const { setName, setLanguage, setCountry, setPhotoUri } = userProfileSlice.actions;
export default userProfileSlice.reducer;
