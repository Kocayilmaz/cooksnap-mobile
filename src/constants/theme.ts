/**
 * ne-pisirsem (web) app/globals.css ile aynı marka renkleri — Tailwind
 * sınıfları (tailwind.config.js) buradaki isimlerle birebir eşleşiyor.
 * Web'de şu an tek (açık) tema var, o yüzden burada da dark varyant yok.
 */

import { Platform } from "react-native";

export const Colors = {
  brandOrange: "#f2600c",
  brandOrangeDark: "#c94e09",
  brandRed: "#e8272b",
  surfaceWarm: "#fffaf5",
  surfaceCard: "#ffffff",
  surfaceBorder: "#f0dfd0",
  surfaceTextMuted: "#8a7a6d",
  stateSuccess: "#1a8f4f",
  stateError: "#e8272b",
  foreground: "#171717",
} as const;

export const Fonts = Platform.select({
  ios: { sans: "system-ui" },
  default: { sans: "normal" },
  web: { sans: "Arial, Helvetica, sans-serif" },
});
