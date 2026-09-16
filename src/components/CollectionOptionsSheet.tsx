import { useEffect } from "react";
import { BackHandler, Pressable, Share, Text, View } from "react-native";
import { Pencil, Plus, Share2, Trash2 } from "lucide-react-native";
import type { Collection } from "@/lib/redux/collectionsSlice";
import { Colors } from "@/constants/theme";

interface CollectionOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  collection: Collection | null;
  onAddItem: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/** Koleksiyon kartındaki "..." menüsü — alttan açılan bir panel (bkz.
 * favorites.tsx). Panel zaten üstüne dokununca (backdrop) kapandığı için
 * ayrı bir "Vazgeç" satırı yok. RN'in <Modal>'ı Android'de bu ortamda üst
 * köşe borderRadius'unu klipsizlemiyor, o yüzden native Modal yerine iki
 * ayrı absolute sibling kullanılıyor (backdrop + panel) — panel'i flex ile
 * bir wrapper içine koymak borderRadius'u bozuyordu, ama panelin kendisi
 * doğrudan bottom/left/right: 0 ile absolute olunca düzgün klipsleniyor. */
export default function CollectionOptionsSheet({ visible, onClose, collection, onAddItem, onRename, onDelete }: CollectionOptionsSheetProps) {
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  if (!visible || !collection) return null;

  async function handleShare() {
    onClose();
    const titles = collection!.items.map((item) => item.title).join(", ");
    try {
      await Share.share({ message: titles ? `${collection!.name}: ${titles}` : `${collection!.name} koleksiyonumu paylaşıyorum.` });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  return (
    <>
      <Pressable
        onPress={onClose}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: "rgba(23,23,23,0.4)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1001,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          backgroundColor: Colors.surfaceWarm,
          gap: 4,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        <Text numberOfLines={1} className="px-1 pb-2 text-sm font-semibold text-surface-text-muted">
          {collection.name}
        </Text>
        <Pressable
          onPress={() => {
            onClose();
            onAddItem();
          }}
          className="flex-row items-center gap-3 py-3"
        >
          <Plus size={18} color={Colors.foreground} />
          <Text className="text-sm font-medium text-foreground">Ürün Ekle</Text>
        </Pressable>
        <Pressable onPress={handleShare} className="flex-row items-center gap-3 py-3">
          <Share2 size={18} color={Colors.foreground} />
          <Text className="text-sm font-medium text-foreground">Paylaş</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onClose();
            onRename();
          }}
          className="flex-row items-center gap-3 py-3"
        >
          <Pencil size={18} color={Colors.foreground} />
          <Text className="text-sm font-medium text-foreground">Koleksiyonu Düzenle</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onClose();
            onDelete();
          }}
          className="flex-row items-center gap-3 py-3"
        >
          <Trash2 size={18} color={Colors.stateError} />
          <Text className="text-sm font-medium text-state-error">Sil</Text>
        </Pressable>
      </View>
    </>
  );
}
