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

/** MealDetail.instructions tek bir metin (bkz. lib/types/meal.ts) — Supabase'deki
 * kendi tariflerimiz "1. ...\n2. ..." şeklinde, TheMealDB'ninkiler ise genelde
 * satır satır (bazen numarasız) geliyor. Baştaki "1." / "1)" numaralandırmasını
 * temizleyip adım adım (meal/[id].tsx'teki yeniden tasarım) gösterim için diziye
 * çevirir — hiç satır kırılması yoksa (nadir ama TheMealDB'de tek paragraf
 * dönebiliyor) tüm metni tek adım olarak döner. */
export function splitInstructionsIntoSteps(instructions: string): string[] {
  const lines = instructions
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [instructions.trim()];
}
