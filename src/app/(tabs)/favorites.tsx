import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChefHat,
  Clock,
  FolderPlus,
  Heart,
  LayoutGrid,
  ListFilter,
  MessageCircle,
  MoreVertical,
  Pencil,
  Search,
  Star,
  Wrench,
} from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleFavorite, type FavoriteRecipe } from "@/lib/redux/favoritesSlice";
import { toggleMealFavorite } from "@/lib/redux/mealFavoritesSlice";
import { EQUIPMENT_KEYS, EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { historyEntryTitle, summarizeHistoryEntry, toggleHistoryFavorite, type HistoryEntry } from "@/lib/redux/historySlice";
import { createCollection, deleteCollection, renameCollection, type Collection } from "@/lib/redux/collectionsSlice";
import { getCategoryLabel } from "@/lib/mealdb/categoryMeta";
import { getAreaLabel } from "@/lib/mealdb/areaMeta";
import type { MealFavorite } from "@/lib/redux/mealFavoritesSlice";
import AddToCollectionSheet from "@/components/AddToCollectionSheet";
import CategoryFilterModal from "@/components/CategoryFilterModal";
import ChecklistFilterModal from "@/components/ChecklistFilterModal";
import CollectionOptionsSheet from "@/components/CollectionOptionsSheet";
import CreateCollectionModal from "@/components/CreateCollectionModal";
import { Colors } from "@/constants/theme";

type FavoritesTab = "favoriler" | "koleksiyonlar";
type FavoritesFilter = "tumu" | "kaydedilenler" | "sohbetler" | "tarifler";

const FILTERS: { key: FavoritesFilter; label: string; icon: typeof LayoutGrid }[] = [
  { key: "tumu", label: "Tümü", icon: LayoutGrid },
  { key: "kaydedilenler", label: "Kaydedilen Tarifler", icon: Clock },
  { key: "sohbetler", label: "Sohbet Favorileri", icon: MessageCircle },
  { key: "tarifler", label: "Tarif Favorileri", icon: ChefHat },
];

const CHIP_HEIGHT = 40;

function makeCollectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * ne-pisirsem'deki app/favorites/page.tsx'in mobil karşılığı — aynı ayrım:
 * "Kaydedilen Tarifler" (anasayfadaki hazır MealDB tariflerinde kalp ile
 * favorilenenler, bkz. MealCard.tsx), "Sohbet Favorileri" (sabitlenen
 * konuşmalar) ve en altta "Tarif Favorileri" (chat'te üretilen, yıldızlanan
 * tarifler) ayrı bölümler. Üstte "Favoriler"/"Koleksiyonlar" sekmeleri var.
 * Her favori satırına uzun basınca (bkz. AddToCollectionSheet) doğrudan o
 * öğeyi bir koleksiyona ekleme açılıyor. "Favorilerini düzenle" (bkz.
 * EditFavoritesModal) toplu seçip silme/koleksiyona ekleme için ayrı bir
 * tam ekran akış.
 */
export default function FavoritesScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const favorites = useAppSelector((state) => state.favorites);
  const mealFavorites = useAppSelector((state) => state.mealFavorites);
  const history = useAppSelector((state) => state.history);
  const collections = useAppSelector((state) => state.collections);
  const [activeTab, setActiveTab] = useState<FavoritesTab>("favoriler");
  const [activeFilter, setActiveFilter] = useState<FavoritesFilter>("tumu");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [renamingCollection, setRenamingCollection] = useState<Collection | null>(null);
  const [optionsCollection, setOptionsCollection] = useState<Collection | null>(null);
  const [singleAddItem, setSingleAddItem] = useState<{
    key: string;
    kind: "meal" | "recipe" | "chat";
    title: string;
    subtitle: string;
    thumbnail: string | null;
    removeFromFavorites: () => void;
  } | null>(null);

  const collectionList = Object.values(collections).sort((a, b) => b.createdAt - a.createdAt);

  function openCollection(id: string, options?: { openAdd?: boolean }) {
    router.push({ pathname: "/collection/[id]", params: { id, ...(options?.openAdd ? { openAdd: "1" } : {}) } });
  }

  function handleCreateCollection(name: string) {
    dispatch(createCollection({ id: makeCollectionId(), name }));
  }

  function openMealCollectionSheet(meal: MealFavorite) {
    setSingleAddItem({
      key: `meal:${meal.id}`,
      kind: "meal",
      title: meal.name,
      subtitle: meal.category ? getCategoryLabel(meal.category) : "",
      thumbnail: meal.thumbnail,
      removeFromFavorites: () => dispatch(toggleMealFavorite(meal)),
    });
  }

  function openRecipeCollectionSheet(recipe: FavoriteRecipe) {
    setSingleAddItem({
      key: `recipe:${recipe.id}`,
      kind: "recipe",
      title: recipe.title,
      subtitle: EQUIPMENT_LABELS[recipe.equipment],
      thumbnail: null,
      removeFromFavorites: () => dispatch(toggleFavorite(recipe)),
    });
  }

  function openChatCollectionSheet(entry: HistoryEntry) {
    setSingleAddItem({
      key: `chat:${entry.id}`,
      kind: "chat",
      title: historyEntryTitle(entry),
      subtitle: summarizeHistoryEntry(entry),
      thumbnail: null,
      removeFromFavorites: () => dispatch(toggleHistoryFavorite(entry.id)),
    });
  }

  const term = searchQuery.trim().toLowerCase();
  const showSavedMeals = activeFilter === "tumu" || activeFilter === "kaydedilenler";
  const showChats = activeFilter === "tumu" || activeFilter === "sohbetler";
  const showRecipes = activeFilter === "tumu" || activeFilter === "tarifler";

  const allRecipes = Object.values(favorites)
    .sort((a, b) => b.savedAt - a.savedAt)
    .filter((recipe) => !term || recipe.title.toLowerCase().includes(term))
    .filter((recipe) => selectedEquipment.length === 0 || selectedEquipment.includes(recipe.equipment));
  const savedMeals = Object.values(mealFavorites)
    .sort((a, b) => b.savedAt - a.savedAt)
    .filter((meal) => !term || meal.name.toLowerCase().includes(term))
    .filter((meal) => selectedCategories.length === 0 || selectedCategories.includes(meal.category));
  const favoriteChats = history
    .filter((entry) => entry.isFavorite)
    .filter((entry) => !term || historyEntryTitle(entry).toLowerCase().includes(term));

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
      <View className="gap-3 px-4 pt-4">
        <View className="flex-row gap-2 rounded-full bg-surface-card p-1">
          {(
            [
              { key: "favoriler", label: "Favoriler" },
              { key: "koleksiyonlar", label: "Koleksiyonlar" },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 items-center rounded-full py-2 ${active ? "bg-brand-orange" : ""}`}
              >
                <Text className={`text-sm font-semibold ${active ? "text-white" : "text-surface-text-muted"}`}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "favoriler" && (
          <View className="flex-row items-center gap-2">
            <View
              style={{ height: CHIP_HEIGHT }}
              className="flex-row items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-3"
            >
              <Search size={14} color={Colors.brandOrange} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ara"
                placeholderTextColor={Colors.surfaceTextMuted}
                style={{ width: 60 }}
                className="text-xs text-foreground"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {FILTERS.map((filter) => {
                const active = activeFilter === filter.key;
                const Icon = filter.icon;
                return (
                  <Pressable
                    key={filter.key}
                    onPress={() => setActiveFilter(filter.key)}
                    style={{
                      height: CHIP_HEIGHT,
                      borderWidth: 1,
                      borderColor: active ? Colors.brandOrange : Colors.surfaceBorder,
                    }}
                    className={`flex-row items-center gap-1.5 rounded-full px-3 ${active ? "bg-brand-orange" : "bg-surface-card"}`}
                  >
                    <Icon size={13} color={active ? "#ffffff" : Colors.brandOrange} />
                    <Text className={`text-xs font-medium ${active ? "text-white" : "text-surface-text-muted"}`}>{filter.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setIsCategoryModalOpen(true)}
                style={{
                  height: CHIP_HEIGHT,
                  borderWidth: 1,
                  borderColor: selectedCategories.length > 0 ? Colors.brandOrange : Colors.surfaceBorder,
                }}
                className={`flex-row items-center gap-1.5 rounded-full px-3 ${selectedCategories.length > 0 ? "bg-brand-orange" : "bg-surface-card"}`}
              >
                <ListFilter size={13} color={selectedCategories.length > 0 ? "#ffffff" : Colors.brandOrange} />
                <Text className={`text-xs font-medium ${selectedCategories.length > 0 ? "text-white" : "text-surface-text-muted"}`}>
                  Kategori{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ""}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsEquipmentModalOpen(true)}
                style={{
                  height: CHIP_HEIGHT,
                  borderWidth: 1,
                  borderColor: selectedEquipment.length > 0 ? Colors.brandOrange : Colors.surfaceBorder,
                }}
                className={`flex-row items-center gap-1.5 rounded-full px-3 ${selectedEquipment.length > 0 ? "bg-brand-orange" : "bg-surface-card"}`}
              >
                <Wrench size={13} color={selectedEquipment.length > 0 ? "#ffffff" : Colors.brandOrange} />
                <Text className={`text-xs font-medium ${selectedEquipment.length > 0 ? "text-white" : "text-surface-text-muted"}`}>
                  Ekipmana Göre{selectedEquipment.length > 0 ? ` (${selectedEquipment.length})` : ""}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/edit-favorites")}
                style={{ height: CHIP_HEIGHT, borderWidth: 1, borderColor: Colors.surfaceBorder }}
                className="flex-row items-center gap-1.5 rounded-full bg-surface-card px-3"
              >
                <Pencil size={13} color={Colors.brandOrange} />
                <Text className="text-xs font-medium text-surface-text-muted">Favorilerini düzenle</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </View>

      {activeTab === "koleksiyonlar" ? (
        <View style={{ flex: 1 }} className="gap-4 px-4 pt-4">
          <Text className="text-sm font-semibold text-brand-orange">Koleksiyonlarım ({collectionList.length})</Text>

          {collectionList.length === 0 ? (
            <View style={{ flex: 1 }} className="items-center justify-center gap-3 px-8">
              <FolderPlus size={40} color={Colors.surfaceTextMuted} />
              <Text className="text-center text-sm font-semibold text-foreground">Henüz koleksiyon oluşturmadın</Text>
              <Text className="text-center text-sm text-surface-text-muted">
                Favorilerini gruplamak için bir koleksiyon oluştur.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerClassName="gap-3 pb-4">
              <View className="flex-row flex-wrap gap-3">
                {collectionList.map((collection) => {
                  const thumbnails = collection.items.map((item) => item.thumbnail).filter((uri): uri is string => Boolean(uri));
                  return (
                    <Pressable
                      key={collection.id}
                      onPress={() => openCollection(collection.id)}
                      style={{ width: "47%" }}
                      className="gap-2 rounded-2xl bg-surface-card p-3 shadow-sm"
                    >
                      <View style={{ aspectRatio: 1.4, borderRadius: 12, overflow: "hidden" }} className="flex-row bg-surface-warm">
                        {thumbnails.length === 0 ? (
                          <View style={{ flex: 1 }} className="items-center justify-center">
                            <FolderPlus size={30} color={Colors.brandOrange} />
                          </View>
                        ) : thumbnails.length === 1 ? (
                          <Image source={{ uri: thumbnails[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                        ) : (
                          <>
                            <Image source={{ uri: thumbnails[0] }} style={{ flex: 1, height: "100%" }} contentFit="cover" />
                            <View style={{ width: 2 }} />
                            <Image source={{ uri: thumbnails[1] }} style={{ flex: 1, height: "100%" }} contentFit="cover" />
                          </>
                        )}
                        <Pressable
                          onPress={() => setOptionsCollection(collection)}
                          hitSlop={8}
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            height: 26,
                            width: 26,
                            borderRadius: 13,
                            backgroundColor: "rgba(255,255,255,0.85)",
                          }}
                          className="items-center justify-center"
                        >
                          <MoreVertical size={15} color={Colors.foreground} />
                        </Pressable>
                      </View>
                      <View className="gap-0.5">
                        <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                          {collection.name}
                        </Text>
                        <Text className="text-xs text-surface-text-muted">{collection.items.length} Ürün</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <Pressable
            onPress={() => setIsCreateCollectionOpen(true)}
            style={{ marginBottom: 12 }}
            className="flex-row items-center justify-center gap-2 self-center rounded-full bg-brand-orange px-6 py-3"
          >
            <FolderPlus size={16} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">Yeni Koleksiyon</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-6 p-4 pb-10">
          {showSavedMeals && (
          <View className="gap-3 rounded-2xl bg-surface-card p-5 shadow-sm">
            <Text className="text-sm font-semibold text-foreground">Kaydedilen Tarifler</Text>
            {savedMeals.length === 0 ? (
              <Text className="text-center text-sm text-surface-text-muted">
                Henüz kaydedilen tarifin yok. Anasayfadaki hazır tariflerde kalbe basarak ekleyebilirsin.
              </Text>
            ) : (
              <View className="gap-3">
                {savedMeals.map((meal) => (
                  <Pressable
                    key={meal.id}
                    onPress={() => router.push({ pathname: "/meal/[id]", params: { id: meal.id } })}
                    onLongPress={() => openMealCollectionSheet(meal)}
                    className="flex-row items-center gap-3 rounded-xl border border-surface-border p-3"
                  >
                    <Image source={{ uri: meal.thumbnail }} style={{ height: 48, width: 48, borderRadius: 10 }} contentFit="cover" />
                    <View style={{ minWidth: 0 }} className="flex-1 gap-0.5">
                      <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                        {meal.name}
                      </Text>
                      <Text numberOfLines={1} className="text-xs text-surface-text-muted">
                        {[meal.category ? getCategoryLabel(meal.category) : null, meal.area ? getAreaLabel(meal.area) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                    <Pressable onPress={() => dispatch(toggleMealFavorite(meal))} hitSlop={8}>
                      <Heart size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          )}

          {showChats && favoriteChats.length > 0 && (
            <View className="gap-3 rounded-2xl bg-surface-card p-5 shadow-sm">
              <Text className="text-sm font-semibold text-foreground">Sohbet Favorileri</Text>
              <Text className="text-xs text-surface-text-muted">
                Sohbet geçmişinde sabitlediğin konuşmalar — aşağıdaki tarif favorilerinden ayrı.
              </Text>
              <View className="gap-2">
                {favoriteChats.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => router.push({ pathname: "/(tabs)/chat", params: { historyEntryId: entry.id } })}
                    onLongPress={() => openChatCollectionSheet(entry)}
                    className="flex-row items-center justify-between gap-2 rounded-xl border border-surface-border p-3"
                  >
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm font-semibold text-foreground">{historyEntryTitle(entry)}</Text>
                      <Text className="text-xs text-surface-text-muted">{summarizeHistoryEntry(entry)}</Text>
                    </View>
                    <Pressable onPress={() => dispatch(toggleHistoryFavorite(entry.id))} hitSlop={8}>
                      <Star size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {showRecipes && (
          <View className="gap-3 rounded-2xl bg-surface-card p-5 shadow-sm">
            <Text className="text-sm font-semibold text-foreground">Tarif Favorileri</Text>
            {allRecipes.length === 0 ? (
              <Text className="text-center text-sm text-surface-text-muted">
                Henüz favori tarifin yok. Chat&apos;ten bir tarif alıp yıldıza basarak ekleyebilirsin.
              </Text>
            ) : (
              <View className="gap-3">
                {allRecipes.map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } })}
                    onLongPress={() => openRecipeCollectionSheet(recipe)}
                    className="rounded-xl border border-surface-border p-3"
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1 gap-0.5">
                        <Text className="text-sm font-semibold text-foreground">{recipe.title}</Text>
                        <Text className="text-xs text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
                      </View>
                      <Pressable onPress={() => dispatch(toggleFavorite(recipe))} hitSlop={8}>
                        <Star size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          )}
        </ScrollView>
      )}

      <CategoryFilterModal
        visible={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        selected={selectedCategories}
        onApply={setSelectedCategories}
      />
      <ChecklistFilterModal
        visible={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        title="Ekipmana Göre"
        searchable={false}
        options={EQUIPMENT_KEYS.map((key) => ({ key, label: EQUIPMENT_LABELS[key] }))}
        selected={selectedEquipment}
        onApply={setSelectedEquipment}
      />
      <CreateCollectionModal
        visible={isCreateCollectionOpen}
        onClose={() => setIsCreateCollectionOpen(false)}
        onCreate={handleCreateCollection}
      />
      <CreateCollectionModal
        visible={Boolean(renamingCollection)}
        initialName={renamingCollection?.name}
        onClose={() => setRenamingCollection(null)}
        onCreate={(name) => {
          if (renamingCollection) dispatch(renameCollection({ id: renamingCollection.id, name }));
        }}
      />
      <CollectionOptionsSheet
        visible={Boolean(optionsCollection)}
        collection={optionsCollection}
        onClose={() => setOptionsCollection(null)}
        onAddItem={() => optionsCollection && openCollection(optionsCollection.id, { openAdd: true })}
        onRename={() => setRenamingCollection(optionsCollection)}
        onDelete={() =>
          optionsCollection &&
          Alert.alert("Koleksiyonu sil", `"${optionsCollection.name}" koleksiyonunu silmek istediğine emin misin?`, [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => dispatch(deleteCollection(optionsCollection.id)) },
          ])
        }
      />
      <AddToCollectionSheet
        visible={Boolean(singleAddItem)}
        onClose={() => setSingleAddItem(null)}
        items={singleAddItem ? [singleAddItem] : []}
        onDone={(collectionId) => {
          setSingleAddItem(null);
          openCollection(collectionId);
        }}
      />
    </SafeAreaView>
  );
}
