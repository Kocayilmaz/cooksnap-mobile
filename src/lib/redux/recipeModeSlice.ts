import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type RecipeMode = "student" | "home" | "chef";

export const RECIPE_MODE_KEYS: RecipeMode[] = ["student", "home", "chef"];

interface RecipeModeState {
  value: RecipeMode;
}

const initialState: RecipeModeState = {
  value: "home",
};

const recipeModeSlice = createSlice({
  name: "recipeMode",
  initialState,
  reducers: {
    setRecipeMode(state, action: PayloadAction<RecipeMode>) {
      state.value = action.payload;
    },
  },
});

export const { setRecipeMode } = recipeModeSlice.actions;
export default recipeModeSlice.reducer;
