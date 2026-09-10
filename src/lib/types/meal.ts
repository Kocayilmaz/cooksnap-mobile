export interface MealSearchResult {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  area: string;
}

export interface MealIngredient {
  name: string;
  measure: string;
}

export interface MealDetail extends MealSearchResult {
  instructions: string;
  ingredients: MealIngredient[];
  tags: string[];
  /** YouTube video id, çıkarılamadıysa null (bkz. lib/mealdb/client.ts). */
  youtubeVideoId: string | null;
}

export interface MealCategory {
  /** TheMealDB'deki orijinal (İngilizce) kategori adı — filter.php ve URL'de bu kullanılır. */
  name: string;
  thumbnail: string;
  description: string;
}
