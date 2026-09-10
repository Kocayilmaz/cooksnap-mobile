import type { ApiErrorResponse, RecipeRequest, RecipeResponse } from "@/lib/types/recipe";
import type { MealSearchResult } from "@/lib/types/meal";

/**
 * Ortak backend: ayrı bir sunucu değil, ne-pisirsem'in zaten Vercel'de canlı
 * olan /api/* route'ları (bkz. app/api/recipe, app/api/meals/*). CORS bir
 * tarayıcı kısıtı olduğu için React Native'den bu endpoint'lere doğrudan
 * fetch ile erişilebiliyor — web ve mobil aynı AI/tarif mantığını, aynı
 * Groq/Firebase anahtarlarını paylaşıyor, mobil tarafta ayrıca saklanmıyor.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://ne-pisirsem-mu.vercel.app";

export class ApiRequestError extends Error {}

async function parseErrorOr<T extends object>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiErrorResponse;
  if (!response.ok) {
    const message = "error" in data ? data.error : "Beklenmeyen bir hata oluştu.";
    throw new ApiRequestError(message);
  }
  return data as T;
}

export async function requestRecipes(request: RecipeRequest): Promise<RecipeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return parseErrorOr<RecipeResponse>(response);
}

export async function searchMeals(query: string): Promise<MealSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/meals/search?q=${encodeURIComponent(query)}`);
  const data = await parseErrorOr<{ meals: MealSearchResult[] }>(response);
  return data.meals;
}
