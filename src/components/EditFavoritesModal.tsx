import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Check, ChefHat, MessageCircle, Search, X } from "lucide-react-native";
import { useFavoriteTiles } from "@/hooks/useFavoriteTiles";
import AddToCollectionSheet from "@/components/AddToCollectionSheet";
import { Colors } from "@/constants/theme";

interface EditFavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  /** Bir koleksiyona ekleme akışı tamamlandığında çağrılır — bu ekran da
   * kapanıp o koleksiyonun detay ekranı açılsın diye (bkz. favorites.tsx). */
  onCollectionDone: (collectionId: string) => void;
}

/** "Favorilerini düzenle" ekranı — favorilenmiş tarifleri/sohbetleri tek
 * tek seçip toplu silme ya da koleksiyona ekleme yapmak için, alışveriş
 * uygulamalarındaki "Favorilerim" düzenleme ızgarasının karşılığı (bkz.
 * favorites.tsx'teki "Favorilerini düzenle" bağlantısı). Üç favori
 * kaynağının (kaydedilen tarifler, tarif favorileri, sohbet favorileri)
 * hepsini aynı ızgarada gösteriyor (bkz. useFavoriteTiles). */
export default function EditFavoritesModal({ visible, onClose, onCollectionDone }: EditFavoritesModalProps) {
  const tiles = useFavoriteTiles();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false);

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

  function handleDelete() {
    if (selected.size === 0) return;
    Alert.alert("Favorilerden kaldır", `${selected.size} öğeyi favorilerden kaldırmak istediğine emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          for (const key of selected) {
            tiles.find((tile) => tile.key === key)?.remove();
          }
          setSelected(new Set());
        },
      },
    ]);
  }

  const selectedTiles = tiles.filter((tile) => selected.has(tile.key));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
        <View className="flex-row items-center gap-3 px-4 pt-2">
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={Colors.foreground} />
          </Pressable>
          <Text className="flex-1 text-base font-bold text-foreground">Favorilerim ({tiles.length} Öğe)</Text>
        </View>

        <View className="px-4 pt-3">
          <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-2">
            <Search size={14} color={Colors.brandOrange} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tarif, sohbet ara"
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

        <View style={{ borderTopWidth: 1, borderTopColor: Colors.surfaceBorder }} className="flex-row gap-3 p-4">
          <Pressable
            onPress={() => setIsAddToCollectionOpen(true)}
            disabled={selected.size === 0}
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

      <AddToCollectionSheet
        visible={isAddToCollectionOpen}
        onClose={() => {
          setIsAddToCollectionOpen(false);
          setSelected(new Set());
        }}
        items={selectedTiles.map((tile) => ({
          key: tile.key,
          kind: tile.kind,
          title: tile.title,
          subtitle: tile.subtitle,
          thumbnail: tile.thumbnail,
          removeFromFavorites: tile.remove,
        }))}
        onDone={(collectionId) => {
          setSelected(new Set());
          onClose();
          onCollectionDone(collectionId);
        }}
      />
    </Modal>
  );
}
