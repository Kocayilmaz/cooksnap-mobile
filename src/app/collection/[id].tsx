import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, ChefHat, MessageCircle, Plus, Search, Share2, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { addItemToCollection, removeItemFromCollection } from "@/lib/redux/collectionsSlice";
import { useFavoriteTiles } from "@/hooks/useFavoriteTiles";
import { Colors } from "@/constants/theme";

/**
 * Bir koleksiyonun içeriği — önceden bottom-sheet tarzı bir Modal'dı
 * (CollectionDetailModal), kullanıcı bunun "alttan gelen" görünümünü
 * beğenmedi: koleksiyona girmek gerçek bir sayfa gibi hissettirmeli
 * (bkz. meal/[id].tsx'teki Stack push deseni). "Ürün Ekle" de artık ayrı
 * bir tam ekran seçim ekranı — eski Favorilerim ekranındaki (bkz.
 * EditFavoritesModal) çoklu-seç + "Ekle" akışının aynısı, küçük bir
 * bottom-sheet listesi değil.
 */
export default function CollectionDetailScreen() {
  const { id, openAdd } = useLocalSearchParams<{ id: string; openAdd?: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const collection = useAppSelector((state) => state.collections[id]);
  const allFavoriteTiles = useFavoriteTiles();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (openAdd) setIsAddOpen(true);
  }, [openAdd]);

  if (!collection) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-warm">
        <Text className="text-sm text-surface-text-muted">Koleksiyon bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  const term = search.trim().toLowerCase();
  const visibleItems = term ? collection.items.filter((item) => item.title.toLowerCase().includes(term)) : collection.items;

  const existingKeys = new Set(collection.items.map((item) => item.key));
  const availableTiles = allFavoriteTiles.filter((tile) => !existingKeys.has(tile.key));
  const addTerm = addSearch.trim().toLowerCase();
  const visibleAddTiles = addTerm ? availableTiles.filter((tile) => tile.title.toLowerCase().includes(addTerm)) : availableTiles;

  async function handleShare() {
    const titles = collection.items.map((item) => item.title).join(", ");
    try {
      await Share.share({ message: titles ? `${collection.name}: ${titles}` : `${collection.name} koleksiyonumu paylaşıyorum.` });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  function toggleSelected(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function closeAdd() {
    setIsAddOpen(false);
    setAddSearch("");
    setSelectedKeys(new Set());
    if (openAdd) router.setParams({ openAdd: undefined });
  }

  function handleAddSelected() {
    for (const tile of availableTiles) {
      if (!selectedKeys.has(tile.key)) continue;
      dispatch(
        addItemToCollection({
          collectionId: collection.id,
          item: { key: tile.key, kind: tile.kind, title: tile.title, subtitle: tile.subtitle, thumbnail: tile.thumbnail },
        }),
      );
    }
    closeAdd();
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="flex-row items-center gap-1.5">
          <ArrowLeft size={18} color={Colors.foreground} />
        </Pressable>
        <Text className="flex-1 px-2 text-base font-bold text-foreground" numberOfLines={1}>
          {collection.name}
        </Text>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={handleShare} hitSlop={8}>
            <Share2 size={18} color={Colors.surfaceTextMuted} />
          </Pressable>
          <Pressable onPress={() => setIsAddOpen(true)} className="flex-row items-center gap-1 rounded-full bg-brand-orange px-3 py-1.5">
            <Plus size={14} color="#ffffff" />
            <Text className="text-xs font-semibold text-white">Ürün Ekle</Text>
          </Pressable>
        </View>
      </View>

      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-2">
          <Search size={14} color={Colors.brandOrange} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Koleksiyonda ara (${collection.items.length} Ürün)`}
            placeholderTextColor={Colors.surfaceTextMuted}
            className="flex-1 text-sm text-foreground"
          />
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-4 pb-10">
        {visibleItems.length === 0 ? (
          <Text className="mt-10 text-center text-sm text-surface-text-muted">
            {collection.items.length === 0 ? "Bu koleksiyon henüz boş — Ürün Ekle ile başla." : "Eşleşen bir ürün bulunamadı."}
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {visibleItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (item.kind === "meal") {
                    const mealId = item.key.replace("meal:", "");
                    router.push({ pathname: "/meal/[id]", params: { id: mealId } });
                  }
                }}
                style={{ width: "47%" }}
                className="gap-1"
              >
                <View style={{ aspectRatio: 1, borderRadius: 12, overflow: "hidden" }} className="bg-surface-card">
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1 }} className="items-center justify-center">
                      {item.kind === "chat" ? (
                        <MessageCircle size={26} color={Colors.surfaceTextMuted} />
                      ) : (
                        <ChefHat size={26} color={Colors.surfaceTextMuted} />
                      )}
                    </View>
                  )}
                  <Pressable
                    onPress={() => dispatch(removeItemFromCollection({ collectionId: collection.id, itemKey: item.key }))}
                    hitSlop={8}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      height: 24,
                      width: 24,
                      borderRadius: 12,
                      backgroundColor: "rgba(255,255,255,0.85)",
                    }}
                    className="items-center justify-center"
                  >
                    <X size={14} color={Colors.stateError} />
                  </Pressable>
                </View>
                <Text numberOfLines={2} className="text-xs font-medium text-foreground">
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text numberOfLines={1} className="text-xs text-surface-text-muted">
                    {item.subtitle}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isAddOpen} animationType="slide" onRequestClose={closeAdd}>
        <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
          <View className="flex-row items-center gap-3 px-4 pt-2">
            <Pressable onPress={closeAdd} hitSlop={8}>
              <X size={22} color={Colors.foreground} />
            </Pressable>
            <Text className="flex-1 text-base font-bold text-foreground">Ürün Ekle ({availableTiles.length} Öğe)</Text>
          </View>

          <View className="px-4 pt-3">
            <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-2">
              <Search size={14} color={Colors.brandOrange} />
              <TextInput
                value={addSearch}
                onChangeText={setAddSearch}
                placeholder="Tarif, sohbet ara"
                placeholderTextColor={Colors.surfaceTextMuted}
                className="flex-1 text-sm text-foreground"
              />
            </View>
          </View>

          <ScrollView contentContainerClassName="gap-3 p-4 pb-24">
            {visibleAddTiles.length === 0 ? (
              <Text className="mt-10 text-center text-sm text-surface-text-muted">Eklenebilecek başka favori yok.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {visibleAddTiles.map((tile) => {
                  const isSelected = selectedKeys.has(tile.key);
                  return (
                    <Pressable key={tile.key} onPress={() => toggleSelected(tile.key)} style={{ width: "31%" }} className="gap-1">
                      <View style={{ aspectRatio: 1, borderRadius: 12, overflow: "hidden" }} className="bg-surface-card">
                        {tile.thumbnail ? (
                          <Image source={{ uri: tile.thumbnail }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                        ) : (
                          <View style={{ flex: 1 }} className="items-center justify-center">
                            {tile.kind === "chat" ? (
                              <MessageCircle size={26} color={Colors.surfaceTextMuted} />
                            ) : (
                              <ChefHat size={26} color={Colors.surfaceTextMuted} />
                            )}
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

          <View style={{ borderTopWidth: 1, borderTopColor: Colors.surfaceBorder }} className="p-4">
            <Pressable
              onPress={handleAddSelected}
              disabled={selectedKeys.size === 0}
              style={{ opacity: selectedKeys.size === 0 ? 0.5 : 1 }}
              className="items-center rounded-full bg-brand-orange py-3"
            >
              <Text className="text-sm font-semibold text-white">
                Ekle{selectedKeys.size > 0 ? ` (${selectedKeys.size})` : ""}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
