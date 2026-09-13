import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import type { RecipeSuggestion } from "@/lib/types/recipe";

/** Tek bir tarifi düz metne çevirir — panoya kopyalama ve .txt indirme aynı biçimi kullanır. */
export function recipeToText(recipe: RecipeSuggestion): string {
  const stepsText = recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return `${recipe.title}\n${EQUIPMENT_LABELS[recipe.equipment]}\n\n${stepsText}`;
}

/** Bir mesajdaki birden fazla tarifi tek bir metinde birleştirir (kopyala/indir işlemleri için). */
export function recipesToText(recipes: RecipeSuggestion[]): string {
  return recipes.map(recipeToText).join("\n\n---\n\n");
}
