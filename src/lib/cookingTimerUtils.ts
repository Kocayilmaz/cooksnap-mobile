/** ne-pisirsem'deki lib/cookingTimerUtils.ts'in mobil karşılığı — playTimerBeep
 * (Web Audio API) hariç, o RN'de yok; SidebarCookingTimer.tsx yerine
 * Vibration.vibrate() kullanıyor. */
export function formatTimerDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function clampMinutes(minutes: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, minutes));
}

/** Tarif adımı metninden ("Fırında 180 derecede 10 dakika pişirin" gibi) ilk
 * süre ifadesini dakika olarak çıkarır — bulamazsa null döner. Saat/hour
 * birimleri 60 ile çarpılır. Tarif modeli hem Türkçe hem İngilizce
 * üretebildiği için (bkz. buildRecipePrompt.ts LANGUAGE_INSTRUCTIONS) iki
 * dilin de birimleri tanınıyor. */
export function extractDurationMinutes(stepText: string): number | null {
  const match = stepText.match(/(\d+)\s*(saat|dakika|dk|hours?|hrs?|minutes?|mins?)\b/i);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  const unit = match[2].toLowerCase();
  const isHour = unit.startsWith("saat") || unit.startsWith("hour") || unit.startsWith("hr");
  return isHour ? value * 60 : value;
}
