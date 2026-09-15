import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Heart, Share2 } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleFavorite } from "@/lib/redux/favoritesSlice";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { Colors } from "@/constants/theme";

/**
 * Sohbette üretilip yıldızlanan bir tarifin ("Tarif Favorileri", bkz.
 * favorites.tsx) tam metnini gösteren sayfa — bu tariflerin TheMealDB
 * gibi ayrı bir detay kaynağı yok, sadece favoritesSlice'taki başlık/
 * ekipman/adımlar var, o yüzden meal/[id].tsx'ten daha sade.
 */
export default function FavoriteRecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const recipe = useAppSelector((state) => state.favorites[id]);

  if (!recipe) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-warm">
        <Text className="text-sm text-surface-text-muted">Tarif bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  async function handleShare() {
    try {
      await Share.share({ message: `${recipe.title}\n\n${recipe.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}` });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-warm">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-1.5">
            <ArrowLeft size={16} color={Colors.surfaceTextMuted} />
            <Text className="text-sm font-medium text-surface-text-muted">Geri</Text>
          </Pressable>

          <View className="flex-row items-center gap-4">
            <Pressable onPress={handleShare} hitSlop={8}>
              <Share2 size={19} color={Colors.surfaceTextMuted} />
            </Pressable>
            <Pressable onPress={() => dispatch(toggleFavorite(recipe))} hitSlop={8}>
              <Heart size={20} color={Colors.brandOrange} fill={Colors.brandOrange} />
            </Pressable>
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-2xl font-semibold text-brand-red">{recipe.title}</Text>
          <Text className="text-sm text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Hazırlanışı</Text>
          <View className="gap-1.5">
            {recipe.steps.map((step, index) => (
              <Text key={index} className="text-sm text-surface-text-muted">
                {index + 1}. {step}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
