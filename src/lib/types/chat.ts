import type { RecipeSuggestion } from "@/lib/types/recipe";

/** /chat sayfasındaki tek bir sohbet balonu — kullanıcının mesajı ya da AI'ın
 * tarif yanıtı (bkz. components/ChatMessageInput.tsx, app/chat/page.tsx). */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  recipes?: RecipeSuggestion[];
  createdAt: number;
}
