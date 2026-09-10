import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type RecipeLanguage = "tr" | "en";

interface UserProfileState {
  name: string;
  language: RecipeLanguage;
  country: string;
}

const initialState: UserProfileState = {
  name: "",
  language: "tr",
  country: "",
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
  },
});

export const { setName, setLanguage, setCountry } = userProfileSlice.actions;
export default userProfileSlice.reducer;
