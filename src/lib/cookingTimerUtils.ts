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
