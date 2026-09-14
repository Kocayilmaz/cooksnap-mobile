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

/** "Bugün, 15:14" / "Dün, 15:14" / "14 Eylül, 15:14" — ChatGPT'nin uzun
 * basma menüsündeki "Yesterday, 15:14" etiketinin karşılığı. */
export function formatMessageTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return `Bugün, ${time}`;
  if (isSameDay(date, yesterday)) return `Dün, ${time}`;

  const dateLabel = date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  return `${dateLabel}, ${time}`;
}
