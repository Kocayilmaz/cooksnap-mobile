import { useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, View } from "react-native";
import { Folder, FolderPlus, Plus, Trash2, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { addItemToCollection, createCollection, type CollectionItem } from "@/lib/redux/collectionsSlice";
import CreateCollectionModal from "@/components/CreateCollectionModal";
import { notify } from "@/lib/notify";
import { Colors } from "@/constants/theme";

interface AddToCollectionSheetItem extends CollectionItem {
  removeFromFavorites: () => void;
}

interface AddToCollectionSheetProps {
  visible: boolean;
  onClose: () => void;
  items: AddToCollectionSheetItem[];
  /** Öğe(ler) bir koleksiyona eklenip akış tamamlandığında çağrılır —
   * hangi koleksiyona eklendiğini bildirir (bkz. favorites.tsx'in
   * EditFavoritesModal'dan sonra o koleksiyonun ekranını açması). */
  onDone?: (collectionId: string) => void;
}

type Step = "list" | "choice";

function makeCollectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * "Koleksiyona Ekle" akışı — favori bir tarifin/sohbetin üstünde (bkz.
 * meal/[id].tsx, EditFavoritesModal, favorites.tsx) tetiklenir. Mevcut
 * koleksiyonlardan seç ya da yeni oluştur (list, bkz. CreateCollectionModal)
 * → eklendikten sonra favorilerden de silinsin mi diye sor (choice).
 * Öğeler koleksiyona kendi anlık görüntüsüyle (title/thumbnail/...)
 * ekleniyor, sadece bir referans id değil — böylece "favorilerden sil"
 * seçilse de koleksiyondan kaybolmuyor (bkz. collectionsSlice).
 */
export default function AddToCollectionSheet({ visible, onClose, items, onDone }: AddToCollectionSheetProps) {
  const dispatch = useAppDispatch();
  const collections = useAppSelector((state) => state.collections);
  const [step, setStep] = useState<Step>("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setStep("list");
  }, [visible]);

  // RN'in <Modal>'ı Android'de bu ortamda üst köşe borderRadius'unu
  // klipsizlemiyor, o yüzden native Modal yerine iki ayrı absolute sibling
  // kullanılıyor (backdrop + sheet) — sheet'i flex ile bir wrapper içine
  // koymak (backdrop'un flex:1 ile onu ittiği düzen) borderRadius'u
  // bozuyordu, ama sheet'in kendisi doğrudan bottom/left/right: 0 ile
  // absolute olunca düzgün klipsleniyor. Donanım geri tuşu elle bağlanıyor.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  const collectionList = Object.values(collections).sort((a, b) => b.createdAt - a.createdAt);

  function addItemsTo(collectionId: string) {
    for (const item of items) {
      dispatch(
        addItemToCollection({
          collectionId,
          item: { key: item.key, kind: item.kind, title: item.title, subtitle: item.subtitle, thumbnail: item.thumbnail },
        }),
      );
    }
    setTargetCollectionId(collectionId);
    setStep("choice");
  }

  function handleCreateCollection(name: string) {
    const id = makeCollectionId();
    dispatch(createCollection({ id, name }));
    addItemsTo(id);
  }

  function finish() {
    if (targetCollectionId) onDone?.(targetCollectionId);
    onClose();
  }

  function handleKeepInFavorites() {
    notify("Koleksiyona eklendi");
    finish();
  }

  function handleRemoveFromFavorites() {
    for (const item of items) item.removeFromFavorites();
    notify("Koleksiyona eklendi ve favorilerden kaldırıldı");
    finish();
  }

  if (!visible) return null;

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
          maxHeight: "80%",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          backgroundColor: Colors.surfaceWarm,
          gap: 16,
          padding: 16,
        }}
      >
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
                      <Text className="text-xs text-surface-text-muted">{collection.items.length} Ürün</Text>
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

      <CreateCollectionModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateCollection} />
    </>
  );
}
