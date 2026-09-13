/** Bir zaman damgasını "5 dakika önce" gibi göreli bir Türkçe metne çevirir —
 * ChatGPT'nin mesaj altındaki "5 minutes ago" etiketinin karşılığı. */
export function formatRelativeTime(timestamp: number): string {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "az önce";
  if (diffMinutes < 60) return `${diffMinutes} dakika önce`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}
