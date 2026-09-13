import { Alert, Pressable, Text, ToastAndroid, View } from "react-native";
import { Copy, Download, Star } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { makeFavoriteId, toggleFavorite } from "@/lib/redux/favoritesSlice";
import { Colors } from "@/constants/theme";
import type { RecipeSuggestion } from "@/lib/types/recipe";

/** Tarifi düz metne çevirir — hem panoya kopyalama hem .txt olarak
 * paylaşma bu metni kullanıyor. */
function recipeToText(recipe: RecipeSuggestion): string {
  const stepsText = recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return `${recipe.title}\n${EQUIPMENT_LABELS[recipe.equipment]}\n\n${stepsText}`;
}

function notify(message: string) {
  if (ToastAndroid) ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert(message);
}

/**
 * ne-pisirsem'deki RecipeMessageCard'ın sade karşılığı — video embed (YouTube)
 * bu ilk sürümde yok, yıldızla favorileme (favoritesSlice) aynı davranışta.
 * Ayrıca tarifi panoya kopyalama (expo-clipboard) ve .txt olarak indirip
 * paylaşma (expo-file-system + expo-sharing) butonları var.
 */
export default function RecipeMessageCard({ recipe }: { recipe: RecipeSuggestion }) {
  const dispatch = useAppDispatch();
  const id = makeFavoriteId(recipe.equipment, recipe.title);
  const isFavorite = useAppSelector((state) => Boolean(state.favorites[id]));

  async function handleCopy() {
    await Clipboard.setStringAsync(recipeToText(recipe));
    notify("Tarif panoya kopyalandı");
  }

  async function handleDownload() {
    try {
      const safeName = recipe.title.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();
      const file = new File(Paths.cache, `${safeName || "tarif"}.txt`);
      if (file.exists) file.delete();
      file.create();
      file.write(recipeToText(recipe));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "text/plain", dialogTitle: recipe.title });
      } else {
        notify(`Kaydedildi: ${file.uri}`);
      }
    } catch {
      notify("Tarif indirilemedi.");
    }
  }

  return (
    <View className="max-w-[92%] gap-2 self-start rounded-2xl border border-surface-border bg-surface-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View style={{ minWidth: 0 }} className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
            {recipe.title}
          </Text>
          <Text numberOfLines={1} className="text-xs text-surface-text-muted">
            {EQUIPMENT_LABELS[recipe.equipment]}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={handleCopy} hitSlop={8}>
            <Copy size={16} color={Colors.surfaceTextMuted} />
          </Pressable>
          <Pressable onPress={handleDownload} hitSlop={8}>
            <Download size={16} color={Colors.surfaceTextMuted} />
          </Pressable>
          <Pressable
            onPress={() =>
              dispatch(toggleFavorite({ id, title: recipe.title, equipment: recipe.equipment, steps: recipe.steps, videoId: recipe.videoId }))
            }
            hitSlop={8}
          >
            <Star size={18} color={Colors.brandOrange} fill={isFavorite ? Colors.brandOrange : "none"} />
          </Pressable>
        </View>
      </View>
      <View style={{ marginTop: 4 }} className="gap-1">
        {recipe.steps.map((step, index) => (
          <Text key={index} className="text-sm text-surface-text-muted">
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    </View>
  );
}
