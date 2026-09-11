/** TheMealDB'nin "area" (mutfak/ülke) filtresi ~200 ülke dönüyor, ama
 * kullandığımız ücretsiz test key'i ("1") altında bunların büyük çoğunluğu
 * boş dönüyor (filter.php?a=... ile tek tek doğrulandı). Burada sadece
 * gerçekten tarif içerdiği doğrulanmış olanlar, tarif sayısına göre azalan
 * sırada ve Türkçe etiketleriyle tutuluyor. */
export const AREA_LABELS_TR: Record<string, string> = {
  British: "İngiliz",
  Spanish: "İspanyol",
  Turkish: "Türk",
  Chinese: "Çin",
  Jamaican: "Jamaika",
  Polish: "Polonya",
  Thai: "Tayland",
  Vietnamese: "Vietnam",
  Canadian: "Kanada",
  Italian: "İtalyan",
  Uruguayan: "Uruguay",
  Japanese: "Japon",
  Croatian: "Hırvat",
  Egyptian: "Mısır",
  Greek: "Yunan",
  Irish: "İrlanda",
  Malaysian: "Malezya",
  Portuguese: "Portekiz",
  Tunisian: "Tunus",
  Filipino: "Filipin",
  Mexican: "Meksika",
  Moroccan: "Fas",
  Syrian: "Suriye",
  Russian: "Rus",
  Ukrainian: "Ukrayna",
  Kenyan: "Kenya",
};

/** Mega-menüde "Mutfaklar" bölümünde bu sırayla gösterilecek tüm mutfaklar. */
export const AREAS = Object.keys(AREA_LABELS_TR);

export function getAreaLabel(name: string): string {
  return AREA_LABELS_TR[name] ?? name;
}
