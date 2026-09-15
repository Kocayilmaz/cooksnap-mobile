import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Folder, FolderPlus, Plus, Trash2, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { addItemToCollection, createCollection } from "@/lib/redux/collectionsSlice";
import CreateCollectionModal from "@/components/CreateCollectionModal";
import { notify } from "@/lib/notify";
import { Colors } from "@/constants/theme";

interface AddToCollectionSheetItem {
  key: string;
  removeFromFavorites: () => void;
}

interface AddToCollectionSheetProps {
  visible: boolean;
  onClose: () => void;
  items: AddToCollectionSheetItem[];
}

type Step = "list" | "choice";

function makeCollectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * "Koleksiyona Ekle" akışı — favori bir tarifin/sohbetin üstünde (bkz.
 * meal/[id].tsx, EditFavoritesModal) tetiklenir. Mevcut koleksiyonlardan
 * seç ya da yeni oluştur (list, bkz. CreateCollectionModal) → eklendikten
 * sonra favorilerden de silinsin mi diye sor (choice). Alışveriş
 * uygulamalarındaki "koleksiyona ekle" akışının karşılığı.
 */
export default function AddToCollectionSheet({ visible, onClose, items }: AddToCollectionSheetProps) {
  const dispatch = useAppDispatch();
  const collections = useAppSelector((state) => state.collections);
  const [step, setStep] = useState<Step>("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (visible) setStep("list");
  }, [visible]);

  const collectionList = Object.values(collections).sort((a, b) => b.createdAt - a.createdAt);

  function addItemsTo(collectionId: string) {
    for (const item of items) {
      dispatch(addItemToCollection({ collectionId, itemKey: item.key }));
    }
    setStep("choice");
  }

  function handleCreateCollection(name: string) {
    const id = makeCollectionId();
    dispatch(createCollection({ id, name }));
    addItemsTo(id);
  }

  function handleKeepInFavorites() {
    notify("Koleksiyona eklendi");
    onClose();
  }

  function handleRemoveFromFavorites() {
    for (const item of items) item.removeFromFavorites();
    notify("Koleksiyona eklendi ve favorilerden kaldırıldı");
    onClose();
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(23,23,23,0.4)" }} />
        <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" }} className="gap-4 bg-surface-warm p-4">
          {step === "list" ? (
            <>
              <View className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-foreground">Koleksiyona Ekle</Text>
                  <Pressable onPress={onClose} hitSlop={8}>
                    <X size={20} color={Colors.surfaceTextMuted} />
                  </Pressable>
                </View>
                <Text className="text-xs text-surface-text-muted">
                  Ürünü koleksiyonlarından birine ekleyebilir ya da yeni bir koleksiyon oluşturabilirsin.
                </Text>
              </View>

              <ScrollView contentContainerClassName="gap-1">
                <Pressable onPress={() => setIsCreateOpen(true)} className="flex-row items-center gap-3 py-3">
                  <FolderPlus size={20} color={Colors.brandOrange} />
                  <Text className="text-sm font-semibold text-brand-orange">Yeni Oluştur</Text>
                </Pressable>
                {collectionList.map((collection) => (
                  <Pressable key={collection.id} onPress={() => addItemsTo(collection.id)} className="flex-row items-center gap-3 py-3">
                    <Folder size={20} color={Colors.surfaceTextMuted} />
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm font-medium text-foreground">{collection.name}</Text>
                      <Text className="text-xs text-surface-text-muted">{collection.itemKeys.length} Ürün</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <View className="gap-1">
              <Pressable onPress={handleKeepInFavorites} className="flex-row items-center gap-3 py-3">
                <Plus size={18} color={Colors.foreground} />
                <Text className="text-sm font-medium text-foreground">Sadece Koleksiyona Ekle</Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: Colors.surfaceBorder }} />
              <Pressable onPress={handleRemoveFromFavorites} className="flex-row items-center gap-3 py-3">
                <Trash2 size={18} color={Colors.stateError} />
                <Text className="text-sm font-medium text-state-error">Koleksiyona Ekle ve Favorilerden Sil</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      <CreateCollectionModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateCollection} />
    </>
  );
}
