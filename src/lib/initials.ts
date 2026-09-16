/** İsim (varsa e-posta) baş harflerinden bir avatar kısaltması üretir —
 * profil fotoğrafı olmayan kullanıcılar için (bkz. app/profile.tsx,
 * app/(tabs)/index.tsx). */
export function getInitials(name: string, email: string | null): string {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + second).toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() ?? "?";
  return "?";
}
