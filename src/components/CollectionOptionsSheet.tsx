import { Modal, Pressable, Share, Text, View } from "react-native";
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
 * ayrı bir "Vazgeç" satırı yok. */
export default function CollectionOptionsSheet({ visible, onClose, collection, onAddItem, onRename, onDelete }: CollectionOptionsSheetProps) {
  if (!collection) return null;

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(23,23,23,0.4)" }} />
      <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }} className="gap-1 bg-surface-warm p-4 pb-6">
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
    </Modal>
  );
}
