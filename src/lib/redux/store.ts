import { combineReducers, configureStore } from "@reduxjs/toolkit";
import personCountReducer from "./personCountSlice";
import equipmentReducer from "./equipmentSlice";
import apiKeyReducer from "./apiKeySlice";
import recipeModeReducer from "./recipeModeSlice";
import userProfileReducer from "./userProfileSlice";
import favoritesReducer from "./favoritesSlice";
import usageCounterReducer from "./usageCounterSlice";
import historyReducer from "./historySlice";
import authReducer from "./authSlice";
import guestModeReducer from "./guestModeSlice";
import mealSearchHistoryReducer from "./mealSearchHistorySlice";
import mealFavoritesReducer from "./mealFavoritesSlice";

const rootReducer = combineReducers({
  personCount: personCountReducer,
  equipment: equipmentReducer,
  apiKey: apiKeyReducer,
  recipeMode: recipeModeReducer,
  userProfile: userProfileReducer,
  favorites: favoritesReducer,
  usageCounter: usageCounterReducer,
  history: historyReducer,
  auth: authReducer,
  guestMode: guestModeReducer,
  mealSearchHistory: mealSearchHistoryReducer,
  mealFavorites: mealFavoritesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
