import { readJSON, writeJSON } from "@/lib/storage/asyncStorage";
import { EQUIPMENT_KEYS, type Equipment } from "./equipmentSlice";
import { RECIPE_MODE_KEYS } from "./recipeModeSlice";
import type { PremiumProvider } from "./apiKeySlice";
import type { RecipeLanguage } from "./userProfileSlice";
import type { FavoriteRecipe, FavoritesState } from "./favoritesSlice";
import type { MealFavorite, MealFavoritesState } from "./mealFavoritesSlice";
import type { MealSearchHistoryState } from "./mealSearchHistorySlice";
import type { UsageCounterState } from "./usageCounterSlice";
import type { HistoryEntry, HistoryState } from "./historySlice";
import type { Collection, CollectionsState } from "./collectionsSlice";

/**
 * ne-pisirsem (web) her tercihi ayrı bir localStorage anahtarında tutuyordu
 * (bkz. lib/redux/local*Storage.ts) — burada aynı anahtarlar ve aynı
 * doğrulama mantığı AsyncStorage üstünde (asenkron) tekrarlanıyor, tek
 * dosyada toplanmış halde.
 */

// --- apiKey ---
const API_KEY_STORAGE_KEY = "cooksnap:apiKey";
interface StoredApiKey {
  provider: PremiumProvider;
  key: string;
}
function isPremiumProvider(value: unknown): value is PremiumProvider {
  return value === "claude" || value === "openai";
}
function isStoredApiKey(value: unknown): value is StoredApiKey {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<StoredApiKey>;
  return isPremiumProvider(record.provider) && typeof record.key === "string";
}
export const readStoredApiKey = () => readJSON(API_KEY_STORAGE_KEY, isStoredApiKey);
export const writeStoredApiKey = (value: StoredApiKey) => writeJSON(API_KEY_STORAGE_KEY, value);

// --- equipment ---
const EQUIPMENT_STORAGE_KEY = "cooksnap:equipment";
type StoredEquipment = Record<Equipment, boolean>;
function isStoredEquipment(value: unknown): value is StoredEquipment {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<StoredEquipment>;
  return EQUIPMENT_KEYS.every((key) => typeof record[key] === "boolean");
}
export const readStoredEquipment = () => readJSON(EQUIPMENT_STORAGE_KEY, isStoredEquipment);
export const writeStoredEquipment = (value: StoredEquipment) => writeJSON(EQUIPMENT_STORAGE_KEY, value);

// --- favorites (AI tarafından üretilen, yıldızlanan tarifler) ---
const FAVORITES_STORAGE_KEY = "cooksnap:favorites";
function isFavoriteRecipe(value: unknown): value is FavoriteRecipe {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<FavoriteRecipe>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.equipment === "string" &&
    EQUIPMENT_KEYS.includes(record.equipment) &&
    Array.isArray(record.steps) &&
    record.steps.every((step) => typeof step === "string") &&
    typeof record.savedAt === "number"
  );
}
function isFavoritesState(value: unknown): value is FavoritesState {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(isFavoriteRecipe);
}
export const readStoredFavorites = () => readJSON(FAVORITES_STORAGE_KEY, isFavoritesState);
export const writeStoredFavorites = (value: FavoritesState) => writeJSON(FAVORITES_STORAGE_KEY, value);

// --- guestMode ---
const GUEST_MODE_STORAGE_KEY = "cooksnap:guestMode";
export async function readStoredGuestMode(): Promise<boolean> {
  const raw = await readJSON<string>(GUEST_MODE_STORAGE_KEY, (v): v is string => typeof v === "string");
  return raw === "true";
}
export const writeStoredGuestMode = (value: boolean) => writeJSON(GUEST_MODE_STORAGE_KEY, value ? "true" : "false");

// --- history ---
const HISTORY_STORAGE_KEY = "cooksnap:history";
function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<HistoryEntry>;
  return (
    typeof record.id === "string" &&
    typeof record.hadPhoto === "boolean" &&
    typeof record.personCount === "number" &&
    Array.isArray(record.equipment) &&
    record.equipment.every((item) => EQUIPMENT_KEYS.includes(item)) &&
    typeof record.mode === "string" &&
    RECIPE_MODE_KEYS.includes(record.mode as never) &&
    Array.isArray(record.recipeTitles) &&
    record.recipeTitles.every((title) => typeof title === "string") &&
    typeof record.createdAt === "number" &&
    (record.isFavorite === undefined || typeof record.isFavorite === "boolean") &&
    (record.customTitle === undefined || typeof record.customTitle === "string") &&
    (record.messages === undefined || Array.isArray(record.messages))
  );
}
function isHistoryState(value: unknown): value is HistoryState {
  return Array.isArray(value) && value.every(isHistoryEntry);
}
export async function readStoredHistory(): Promise<HistoryState | null> {
  const parsed = await readJSON(HISTORY_STORAGE_KEY, isHistoryState);
  return parsed?.map((entry) => ({ ...entry, isFavorite: entry.isFavorite ?? false })) ?? null;
}
export const writeStoredHistory = (value: HistoryState) => writeJSON(HISTORY_STORAGE_KEY, value);

// --- mealFavorites ---
const MEAL_FAVORITES_STORAGE_KEY = "cooksnap:mealFavorites";
function isMealFavorite(value: unknown): value is MealFavorite {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<MealFavorite>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.thumbnail === "string" &&
    typeof record.category === "string" &&
    typeof record.area === "string" &&
    typeof record.savedAt === "number"
  );
}
function isMealFavoritesState(value: unknown): value is MealFavoritesState {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(isMealFavorite);
}
export const readStoredMealFavorites = () => readJSON(MEAL_FAVORITES_STORAGE_KEY, isMealFavoritesState);
export const writeStoredMealFavorites = (value: MealFavoritesState) => writeJSON(MEAL_FAVORITES_STORAGE_KEY, value);

// --- collections ---
const COLLECTIONS_STORAGE_KEY = "cooksnap:collections";
function isCollection(value: unknown): value is Collection {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<Collection>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.createdAt === "number" &&
    Array.isArray(record.itemKeys) &&
    record.itemKeys.every((key) => typeof key === "string")
  );
}
function isCollectionsState(value: unknown): value is CollectionsState {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(isCollection);
}
export const readStoredCollections = () => readJSON(COLLECTIONS_STORAGE_KEY, isCollectionsState);
export const writeStoredCollections = (value: CollectionsState) => writeJSON(COLLECTIONS_STORAGE_KEY, value);

// --- mealSearchHistory ---
const MEAL_SEARCH_HISTORY_STORAGE_KEY = "cooksnap:mealSearchHistory";
function isMealSearchResult(value: unknown): value is MealSearchHistoryState[number] {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<MealSearchHistoryState[number]>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.thumbnail === "string" &&
    typeof record.category === "string" &&
    typeof record.area === "string"
  );
}
function isMealSearchHistoryState(value: unknown): value is MealSearchHistoryState {
  return Array.isArray(value) && value.every(isMealSearchResult);
}
export const readStoredMealSearchHistory = () =>
  readJSON(MEAL_SEARCH_HISTORY_STORAGE_KEY, isMealSearchHistoryState);
export const writeStoredMealSearchHistory = (value: MealSearchHistoryState) =>
  writeJSON(MEAL_SEARCH_HISTORY_STORAGE_KEY, value);

// --- usage ---
const USAGE_STORAGE_KEY = "cooksnap:usageCount";
function isUsageState(value: unknown): value is UsageCounterState {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<UsageCounterState>;
  return (
    typeof record.count === "number" &&
    Number.isInteger(record.count) &&
    record.count >= 0 &&
    typeof record.lastResetAt === "number"
  );
}
export const readStoredUsage = () => readJSON(USAGE_STORAGE_KEY, isUsageState);
export const writeStoredUsage = (value: UsageCounterState) => writeJSON(USAGE_STORAGE_KEY, value);

// --- userProfile ---
const USER_PROFILE_STORAGE_KEY = "cooksnap:userProfile";
interface StoredUserProfile {
  name: string;
  language: RecipeLanguage;
  country: string;
}
function isRecipeLanguage(value: unknown): value is RecipeLanguage {
  return value === "tr" || value === "en";
}
function isStoredUserProfile(value: unknown): value is StoredUserProfile {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<StoredUserProfile>;
  return typeof record.name === "string" && isRecipeLanguage(record.language) && typeof record.country === "string";
}
export const readStoredUserProfile = () => readJSON(USER_PROFILE_STORAGE_KEY, isStoredUserProfile);
export const writeStoredUserProfile = (value: StoredUserProfile) => writeJSON(USER_PROFILE_STORAGE_KEY, value);
