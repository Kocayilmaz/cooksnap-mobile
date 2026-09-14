import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Check, ChefHat, Search, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleFavorite } from "@/lib/redux/favoritesSlice";
import { toggleMealFavorite } from "@/lib/redux/mealFavoritesSlice";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { getCategoryLabel } from "@/lib/mealdb/categoryMeta";
import { notify } from "@/lib/notify";
import { Colors } from "@/constants/theme";

interface EditFavoritesModalProps {
  visible: boolean;
  onClose: () => void;
}

type FavoriteTile = { key: string; kind: "meal" | "recipe"; thumbnail: string | null; title: string; subtitle: string };

/** "Favorilerini düzenle" ekranı — favorilenmiş tarifleri tek tek seçip
 * toplu silme (ya da ileride koleksiyona ekleme) yapmak için, alışveriş
 * uygulamalarındaki "Favorilerim" düzenleme ızgarasının karşılığı (bkz.
 * favorites.tsx'teki "Favorilerini düzenle" bağlantısı). */
export default function EditFavoritesModal({ visible, onClose }: EditFavoritesModalProps) {
  const dispatch = useAppDispatch();
  const mealFavorites = useAppSelector((state) => state.mealFavorites);
  const favorites = useAppSelector((state) => state.favorites);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tiles = useMemo<FavoriteTile[]>(() => {
    const meals: FavoriteTile[] = Object.values(mealFavorites)
      .sort((a, b) => b.savedAt - a.savedAt)
      .map((meal) => ({
        key: `meal:${meal.id}`,
        kind: "meal" as const,
        thumbnail: meal.thumbnail,
        title: meal.name,
        subtitle: meal.category ? getCategoryLabel(meal.category) : "",
      }));
    const recipes: FavoriteTile[] = Object.values(favorites)
      .sort((a, b) => b.savedAt - a.savedAt)
      .map((recipe) => ({
        key: `recipe:${recipe.id}`,
        kind: "recipe" as const,
        thumbnail: null,
        title: recipe.title,
        subtitle: EQUIPMENT_LABELS[recipe.equipment],
      }));
    return [...meals, ...recipes];
  }, [mealFavorites, favorites]);

  const term = search.trim().toLowerCase();
  const visibleTiles = term ? tiles.filter((tile) => tile.title.toLowerCase().includes(term)) : tiles;

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAddToCollection() {
    if (selected.size === 0) return;
    notify("Koleksiyonlar yakında");
  }

  function handleDelete() {
    if (selected.size === 0) return;
    Alert.alert("Favorilerden kaldır", `${selected.size} tarifi favorilerden kaldırmak istediğine emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          for (const key of selected) {
            const tile = tiles.find((item) => item.key === key);
            if (!tile) continue;
            if (tile.kind === "meal") {
              const meal = mealFavorites[key.replace("meal:", "")];
              if (meal) dispatch(toggleMealFavorite(meal));
            } else {
              const recipe = favorites[key.replace("recipe:", "")];
              if (recipe) dispatch(toggleFavorite(recipe));
            }
          }
          setSelected(new Set());
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
        <View className="flex-row items-center gap-3 px-4 pt-2">
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={Colors.foreground} />
          </Pressable>
          <Text className="flex-1 text-base font-bold text-foreground">Favorilerim ({tiles.length} Tarif)</Text>
        </View>

        <View className="px-4 pt-3">
          <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-2">
            <Search size={14} color={Colors.brandOrange} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tarif, kategori ara"
              placeholderTextColor={Colors.surfaceTextMuted}
              className="flex-1 text-sm text-foreground"
            />
          </View>
        </View>

        <ScrollView contentContainerClassName="gap-3 p-4 pb-24">
          {visibleTiles.length === 0 ? (
            <Text className="mt-10 text-center text-sm text-surface-text-muted">Eşleşen bir favori bulunamadı.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {visibleTiles.map((tile) => {
                const isSelected = selected.has(tile.key);
                return (
                  <Pressable key={tile.key} onPress={() => toggleSelected(tile.key)} style={{ width: "31%" }} className="gap-1">
                    <View style={{ aspectRatio: 1, borderRadius: 12, overflow: "hidden" }} className="bg-surface-card">
                      {tile.thumbnail ? (
                        <Image source={{ uri: tile.thumbnail }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      ) : (
                        <View style={{ flex: 1 }} className="items-center justify-center">
                          <ChefHat size={26} color={Colors.surfaceTextMuted} />
                        </View>
                      )}
                      <View
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          height: 22,
                          width: 22,
                          borderRadius: 11,
                          borderWidth: 1.5,
                          borderColor: isSelected ? Colors.brandOrange : "#ffffff",
                          backgroundColor: isSelected ? Colors.brandOrange : "rgba(255,255,255,0.6)",
                        }}
                        className="items-center justify-center"
                      >
                        {isSelected && <Check size={13} color="#ffffff" />}
                      </View>
                    </View>
                    <Text numberOfLines={2} className="text-xs font-medium text-foreground">
                      {tile.title}
                    </Text>
                    {tile.subtitle && (
                      <Text numberOfLines={1} className="text-xs text-surface-text-muted">
                        {tile.subtitle}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: Colors.surfaceBorder }} className="flex-row gap-3 p-4">
          <Pressable
            onPress={handleAddToCollection}
            style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
            className="flex-1 items-center rounded-full border border-surface-border py-3"
          >
            <Text className="text-sm font-semibold text-foreground">Koleksiyona Ekle</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
            className="flex-1 items-center rounded-full bg-brand-orange py-3"
          >
            <Text className="text-sm font-semibold text-white">Sil</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
