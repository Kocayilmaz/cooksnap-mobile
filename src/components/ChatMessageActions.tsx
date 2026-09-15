import { Pressable, Text, View } from "react-native";
import { Copy, Download, GitBranch, Star } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { makeFavoriteId, toggleFavorite } from "@/lib/redux/favoritesSlice";
import { recipesToText } from "@/lib/recipeText";
import { formatRelativeTime } from "@/lib/relativeTime";
import { notify } from "@/lib/notify";
import { Colors } from "@/constants/theme";
import type { RecipeSuggestion } from "@/lib/types/recipe";

interface ChatMessageActionsProps {
  /** Yapılandırılmış tarifler varsa (AI'nın önerdiği kartlar) kopyala/indir/
   * yıldızla bunları kullanır. */
  recipes?: RecipeSuggestion[];
  /** Tarif kartı olmayan, düz metin cevaplar için (bkz. app/(tabs)/chat.tsx
   * handleSelectEntry'nin ürettiği özet mesajlar). Bu durumda yıldız tek
   * tek tarif değil, tüm sohbeti (isChatFavorite/onToggleChatFavorite ile)
   * favoriliyor — her AI cevabının altında bir yıldız olsun diye. */
  text?: string;
  createdAt: number;
  onBranch: () => void;
  isChatFavorite?: boolean;
  onToggleChatFavorite?: () => void;
}

/**
 * ChatGPT'nin mesaj altındaki ikon çubuğunun (kopyala/paylaş/pinle/dallan +
 * "X minutes ago") karşılığı — artık RecipeMessageCard'ın kendi başlığında
 * değil, o mesajdaki tüm tariflerin altında tek sefer gösteriliyor.
 * "Yeni dalda aç" (GitBranch) o ana kadarki mesajları ayrı, bağımsız bir
 * sohbet olarak kaydedip oraya geçiyor — ChatGPT'nin "branch in new chat"
 * özelliğinin karşılığı (bkz. handleBranchFrom, app/(tabs)/chat.tsx).
 */
export default function ChatMessageActions({
  recipes = [],
  text,
  createdAt,
  onBranch,
  isChatFavorite,
  onToggleChatFavorite,
}: ChatMessageActionsProps) {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites);
  const hasRecipes = recipes.length > 0;
  const isFavorite = hasRecipes && recipes.every((recipe) => Boolean(favorites[makeFavoriteId(recipe.equipment, recipe.title)]));
  const contentText = hasRecipes ? recipesToText(recipes) : text ?? "";

  async function handleCopy() {
    await Clipboard.setStringAsync(contentText);
    notify("Metin panoya kopyalandı");
  }

  async function handleDownload() {
    try {
      const safeName = (recipes[0]?.title ?? "sohbet").replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();
      const file = new File(Paths.cache, `${safeName || "sohbet"}.txt`);
      if (file.exists) file.delete();
      file.create();
      file.write(contentText);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "text/plain", dialogTitle: recipes[0]?.title });
      } else {
        notify(`Kaydedildi: ${file.uri}`);
      }
    } catch {
      notify("İndirilemedi.");
    }
  }

  function handleToggleFavorite() {
    const nextFavorite = !isFavorite;
    for (const recipe of recipes) {
      const id = makeFavoriteId(recipe.equipment, recipe.title);
      const alreadyFavorite = Boolean(favorites[id]);
      if (nextFavorite !== alreadyFavorite) {
        dispatch(toggleFavorite({ id, title: recipe.title, equipment: recipe.equipment, steps: recipe.steps, videoId: recipe.videoId }));
      }
    }
  }

  return (
    <View className="flex-row items-center justify-between" style={{ marginTop: 2, paddingHorizontal: 4 }}>
      <View className="flex-row items-center gap-4">
        <Pressable onPress={handleCopy} hitSlop={8}>
          <Copy size={15} color={Colors.surfaceTextMuted} />
        </Pressable>
        <Pressable onPress={handleDownload} hitSlop={8}>
          <Download size={15} color={Colors.surfaceTextMuted} />
        </Pressable>
        {hasRecipes ? (
          <Pressable onPress={handleToggleFavorite} hitSlop={8}>
            <Star size={15} color={Colors.brandOrange} fill={isFavorite ? Colors.brandOrange : "none"} />
          </Pressable>
        ) : (
          onToggleChatFavorite && (
            <Pressable onPress={onToggleChatFavorite} hitSlop={8}>
              <Star size={15} color={Colors.brandOrange} fill={isChatFavorite ? Colors.brandOrange : "none"} />
            </Pressable>
          )
        )}
        <Pressable onPress={onBranch} hitSlop={8}>
          <GitBranch size={15} color={Colors.surfaceTextMuted} />
        </Pressable>
      </View>
      <Text className="text-xs text-surface-text-muted">{formatRelativeTime(createdAt)}</Text>
    </View>
  );
}
