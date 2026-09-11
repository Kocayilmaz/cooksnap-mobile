/** TheMealDB kategori adları İngilizce (filter.php/URL bunu bekliyor), bu
 * yüzden ekranda gösterilecek Türkçe etiket ve kısa açıklamalar burada elle
 * tutuluyor (AI çevirisi her ana sayfa yüklemesinde yavaş/gereksiz olurdu). */
export const CATEGORY_LABELS_TR: Record<string, string> = {
  Breakfast: "Kahvaltı",
  Chicken: "Tavuk",
  Pasta: "Makarna",
  Dessert: "Tatlı",
  Vegetarian: "Vejetaryen",
  Seafood: "Deniz Ürünleri",
  Beef: "Dana Eti",
  Vegan: "Vegan",
  Side: "Yan Yemek",
  Starter: "Başlangıç",
  Pork: "Domuz Eti",
  Lamb: "Kuzu Eti",
  Miscellaneous: "Diğer",
  Goat: "Keçi Eti",
};

/** Kategori barında bu sırayla, en başta gösterilecek olanlar — geri kalan
 * kategoriler TheMealDB'den geldiği sırayla bunların ardından eklenir. */
export const FEATURED_CATEGORY_ORDER = [
  "Breakfast",
  "Chicken",
  "Pasta",
  "Dessert",
  "Vegetarian",
  "Seafood",
  "Beef",
  "Vegan",
  "Side",
  "Starter",
  "Lamb",
  "Pork",
  "Goat",
];

export function getCategoryLabel(name: string): string {
  return CATEGORY_LABELS_TR[name] ?? name;
}

/** Kategorileri, öne çıkanlar en başta olacak şekilde sıralar. */
export function sortCategoriesFeaturedFirst<T extends { name: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const indexA = FEATURED_CATEGORY_ORDER.indexOf(a.name);
    const indexB = FEATURED_CATEGORY_ORDER.indexOf(b.name);
    const rankA = indexA === -1 ? FEATURED_CATEGORY_ORDER.length : indexA;
    const rankB = indexB === -1 ? FEATURED_CATEGORY_ORDER.length : indexB;
    return rankA - rankB;
  });
}
