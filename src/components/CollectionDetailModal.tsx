import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, ChefHat, MessageCircle, Plus, Search, Share2, X } from "lucide-react-native";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addItemToCollection, removeItemFromCollection, type Collection } from "@/lib/redux/collectionsSlice";
import { useFavoriteTiles } from "@/hooks/useFavoriteTiles";
import { Colors } from "@/constants/theme";

interface CollectionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  collection: Collection | null;
  /** Açılır açılmaz "Ürün Ekle" seçicisini de göster — koleksiyon kartının
   * "..." menüsündeki "Ürün Ekle" seçeneğinden (bkz. favorites.tsx). */
  autoOpenPicker?: boolean;
}

/** Bir koleksiyonun içeriğini gösteren tam ekran — arama, ızgara halinde
 * öğeler, paylaşma ve "Ürün Ekle" ile favorilerden bu koleksiyona henüz
 * eklenmemiş öğeleri seçme (bkz. favorites.tsx'teki Koleksiyonlar sekmesi).
 * Öğeler koleksiyonun kendi anlık görüntüsünden (collection.items) okunuyor
 * — favorilerden silinmiş olsalar bile burada görünmeye devam ediyor. */
export default function CollectionDetailModal({ visible, onClose, collection, autoOpenPicker }: CollectionDetailModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const allFavoriteTiles = useFavoriteTiles();
  const [search, setSearch] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  useEffect(() => {
    if (visible) setIsPickerOpen(Boolean(autoOpenPicker));
  }, [visible, autoOpenPicker]);

  if (!collection) return null;

  const term = search.trim().toLowerCase();
  const visibleItems = term ? collection.items.filter((item) => item.title.toLowerCase().includes(term)) : collection.items;

  const existingKeys = new Set(collection.items.map((item) => item.key));
  const availableTiles = allFavoriteTiles.filter((tile) => !existingKeys.has(tile.key));
  const pickerTerm = pickerSearch.trim().toLowerCase();
  const visiblePickerTiles = pickerTerm ? availableTiles.filter((tile) => tile.title.toLowerCase().includes(pickerTerm)) : availableTiles;

  async function handleShare() {
    if (!collection) return;
    const titles = collection.items.map((item) => item.title).join(", ");
    try {
      await Share.share({ message: titles ? `${collection.name}: ${titles}` : `${collection.name} koleksiyonumu paylaşıyorum.` });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Pressable onPress={onClose} hitSlop={8} className="flex-row items-center gap-1.5">
            <ArrowLeft size={18} color={Colors.foreground} />
          </Pressable>
          <Text className="flex-1 px-2 text-base font-bold text-foreground" numberOfLines={1}>
            {collection.name}
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={handleShare} hitSlop={8}>
              <Share2 size={18} color={Colors.surfaceTextMuted} />
            </Pressable>
            <Pressable onPress={() => setIsPickerOpen(true)} className="flex-row items-center gap-1 rounded-full bg-brand-orange px-3 py-1.5">
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
                      onClose();
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
      </SafeAreaView>

      <Modal visible={isPickerOpen} transparent animationType="slide" onRequestClose={() => setIsPickerOpen(false)}>
        <Pressable onPress={() => setIsPickerOpen(false)} style={{ flex: 1, backgroundColor: "rgba(23,23,23,0.4)" }} />
        <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" }} className="gap-4 bg-surface-warm p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-foreground">Ürün Ekle</Text>
            <Pressable onPress={() => setIsPickerOpen(false)} hitSlop={8}>
              <X size={20} color={Colors.surfaceTextMuted} />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-2">
            <Search size={14} color={Colors.surfaceTextMuted} />
            <TextInput
              value={pickerSearch}
              onChangeText={setPickerSearch}
              placeholder="Tarif, sohbet ara"
              placeholderTextColor={Colors.surfaceTextMuted}
              className="flex-1 text-sm text-foreground"
            />
          </View>
          <ScrollView contentContainerClassName="gap-1">
            {visiblePickerTiles.length === 0 ? (
              <Text className="py-6 text-center text-sm text-surface-text-muted">Eklenebilecek başka favori yok.</Text>
            ) : (
              visiblePickerTiles.map((tile) => (
                <Pressable
                  key={tile.key}
                  onPress={() =>
                    dispatch(
                      addItemToCollection({
                        collectionId: collection.id,
                        item: { key: tile.key, kind: tile.kind, title: tile.title, subtitle: tile.subtitle, thumbnail: tile.thumbnail },
                      }),
                    )
                  }
                  className="flex-row items-center gap-3 py-2.5"
                >
                  <View style={{ height: 40, width: 40, borderRadius: 8, overflow: "hidden" }} className="bg-surface-card">
                    {tile.thumbnail ? (
                      <Image source={{ uri: tile.thumbnail }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    ) : (
                      <View style={{ flex: 1 }} className="items-center justify-center">
                        {tile.kind === "chat" ? (
                          <MessageCircle size={18} color={Colors.surfaceTextMuted} />
                        ) : (
                          <ChefHat size={18} color={Colors.surfaceTextMuted} />
                        )}
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                    {tile.title}
                  </Text>
                  <Check size={16} color={Colors.surfaceBorder} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}
