import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChefHat,
  Clock,
  FolderHeart,
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
import { toggleFavorite } from "@/lib/redux/favoritesSlice";
import { toggleMealFavorite } from "@/lib/redux/mealFavoritesSlice";
import { EQUIPMENT_KEYS, EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { historyEntryTitle, summarizeHistoryEntry, toggleHistoryFavorite } from "@/lib/redux/historySlice";
import { createCollection, deleteCollection, renameCollection, type Collection } from "@/lib/redux/collectionsSlice";
import { getCategoryLabel } from "@/lib/mealdb/categoryMeta";
import { getAreaLabel } from "@/lib/mealdb/areaMeta";
import CategoryFilterModal from "@/components/CategoryFilterModal";
import ChecklistFilterModal from "@/components/ChecklistFilterModal";
import CollectionDetailModal from "@/components/CollectionDetailModal";
import CreateCollectionModal from "@/components/CreateCollectionModal";
import EditFavoritesModal from "@/components/EditFavoritesModal";
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

/**
 * ne-pisirsem'deki app/favorites/page.tsx'in mobil karşılığı — aynı ayrım:
 * "Kaydedilen Tarifler" (anasayfadaki hazır MealDB tariflerinde kalp ile
 * favorilenenler, bkz. MealCard.tsx), "Sohbet Favorileri" (sabitlenen
 * konuşmalar) ve en altta "Tarif Favorileri" (chat'te üretilen, yıldızlanan
 * tarifler) ayrı bölümler. Üstte "Favoriler"/"Koleksiyonlar" sekmeleri var —
 * Koleksiyonlar şimdilik yer tutucu, kullanıcı tanımlı koleksiyon özelliği
 * henüz veri modelinde yok. "Favorilerini düzenle" (bkz. EditFavoritesModal)
 * toplu seçip silme/koleksiyona ekleme için ayrı bir tam ekran akış.
 */
export default function FavoritesScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const favorites = useAppSelector((state) => state.favorites);
  const mealFavorites = useAppSelector((state) => state.mealFavorites);
  const history = useAppSelector((state) => state.history);
  const [activeTab, setActiveTab] = useState<FavoritesTab>("favoriler");
  const [activeFilter, setActiveFilter] = useState<FavoritesFilter>("tumu");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const collections = useAppSelector((state) => state.collections);
  const [collectionsSubTab, setCollectionsSubTab] = useState<"koleksiyonlarim" | "kaydettiklerim">("koleksiyonlarim");
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);
  const [renamingCollection, setRenamingCollection] = useState<Collection | null>(null);

  const collectionList = Object.values(collections).sort((a, b) => b.createdAt - a.createdAt);
  const openCollection: Collection | null = openCollectionId ? collections[openCollectionId] ?? null : null;

  function makeCollectionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function handleCreateCollection(name: string) {
    dispatch(createCollection({ id: makeCollectionId(), name }));
  }

  function handleCollectionMenu(collection: Collection) {
    Alert.alert(collection.name, undefined, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Yeniden Adlandır", onPress: () => setRenamingCollection(collection) },
      {
        text: "Sil",
        style: "destructive",
        onPress: () =>
          Alert.alert("Koleksiyonu sil", `"${collection.name}" koleksiyonunu silmek istediğine emin misin?`, [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => dispatch(deleteCollection(collection.id)) },
          ]),
      },
    ]);
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
                onPress={() => setIsEditModalOpen(true)}
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
          <View className="flex-row items-center justify-between">
            <View className="flex-row gap-4">
              {(
                [
                  { key: "koleksiyonlarim", label: `Koleksiyonlarım (${collectionList.length})` },
                  { key: "kaydettiklerim", label: "Kaydettiklerim (0)" },
                ] as const
              ).map((tab) => {
                const active = collectionsSubTab === tab.key;
                return (
                  <Pressable key={tab.key} onPress={() => setCollectionsSubTab(tab.key)}>
                    <Text className={`text-sm font-semibold ${active ? "text-brand-orange" : "text-surface-text-muted"}`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setIsCreateCollectionOpen(true)}
              className="flex-row items-center gap-1 rounded-full bg-brand-orange px-3 py-1.5"
            >
              <FolderPlus size={14} color="#ffffff" />
              <Text className="text-xs font-semibold text-white">Yeni</Text>
            </Pressable>
          </View>

          {collectionsSubTab === "kaydettiklerim" ? (
            <View style={{ flex: 1 }} className="items-center justify-center gap-3 px-8">
              <FolderHeart size={40} color={Colors.surfaceTextMuted} />
              <Text className="text-center text-sm font-semibold text-foreground">Henüz kaydedilen koleksiyon yok</Text>
              <Text className="text-center text-sm text-surface-text-muted">
                Başkalarının paylaştığı koleksiyonları buraya kaydedebileceksin.
              </Text>
            </View>
          ) : collectionList.length === 0 ? (
            <View style={{ flex: 1 }} className="items-center justify-center gap-3 px-8">
              <FolderPlus size={40} color={Colors.surfaceTextMuted} />
              <Text className="text-center text-sm font-semibold text-foreground">Henüz koleksiyon oluşturmadın</Text>
              <Text className="text-center text-sm text-surface-text-muted">
                Favorilerini gruplamak için bir koleksiyon oluştur.
              </Text>
              <Pressable onPress={() => setIsCreateCollectionOpen(true)} className="rounded-full bg-brand-orange px-5 py-2.5">
                <Text className="text-sm font-semibold text-white">Koleksiyon Oluştur</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerClassName="gap-3 pb-10">
              <View className="flex-row flex-wrap gap-3">
                {collectionList.map((collection) => (
                  <Pressable
                    key={collection.id}
                    onPress={() => setOpenCollectionId(collection.id)}
                    style={{ width: "47%" }}
                    className="gap-2 rounded-2xl bg-surface-card p-3 shadow-sm"
                  >
                    <View style={{ aspectRatio: 1.4, borderRadius: 12, overflow: "hidden" }} className="items-center justify-center bg-surface-warm">
                      <FolderHeart size={30} color={Colors.brandOrange} />
                    </View>
                    <View className="flex-row items-start justify-between gap-1">
                      <View className="flex-1 gap-0.5">
                        <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                          {collection.name}
                        </Text>
                        <Text className="text-xs text-surface-text-muted">{collection.itemKeys.length} Ürün</Text>
                      </View>
                      <Pressable onPress={() => handleCollectionMenu(collection)} hitSlop={8}>
                        <MoreVertical size={16} color={Colors.surfaceTextMuted} />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
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
                  <View key={entry.id} className="flex-row items-center justify-between gap-2 rounded-xl border border-surface-border p-3">
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm font-semibold text-foreground">{historyEntryTitle(entry)}</Text>
                      <Text className="text-xs text-surface-text-muted">{summarizeHistoryEntry(entry)}</Text>
                    </View>
                    <Pressable onPress={() => dispatch(toggleHistoryFavorite(entry.id))} hitSlop={8}>
                      <Star size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
                    </Pressable>
                  </View>
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
                  <View key={recipe.id} className="rounded-xl border border-surface-border p-3">
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1 gap-0.5">
                        <Text className="text-sm font-semibold text-foreground">{recipe.title}</Text>
                        <Text className="text-xs text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
                      </View>
                      <Pressable onPress={() => dispatch(toggleFavorite(recipe))} hitSlop={8}>
                        <Star size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
                      </Pressable>
                    </View>
                  </View>
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
      <EditFavoritesModal visible={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
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
      <CollectionDetailModal
        visible={Boolean(openCollection)}
        collection={openCollection}
        onClose={() => setOpenCollectionId(null)}
      />
    </SafeAreaView>
  );
}
