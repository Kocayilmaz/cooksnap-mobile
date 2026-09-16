import { useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Check, X } from "lucide-react-native";
import { Colors } from "@/constants/theme";

interface CreateCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  /** Verilirse "Koleksiyon Oluştur" yerine yeniden adlandırma metinleri
   * gösterilir (bkz. favorites.tsx'teki "..." menüsü). */
  initialName?: string;
}

const SUGGESTED_NAMES = ["Kahvaltılıklarım 🍳", "Akşam Yemeklerim 🍽️", "Tatlı Tariflerim 🍰", "Sağlıklı Tarifler 🥗", "Pratik Tarifler ⏱️"];

/** Boş bir isim girişiyle koleksiyon oluşturma (ya da mevcut birini
 * yeniden adlandırma) ekranı — hem doğrudan Koleksiyonlar sekmesinden hem
 * de AddToCollectionSheet'in "Yeni Oluştur" adımından kullanılıyor. */
export default function CreateCollectionModal({ visible, onClose, onCreate, initialName }: CreateCollectionModalProps) {
  const isRenaming = Boolean(initialName);
  const [name, setName] = useState(initialName ?? "");

  useEffect(() => {
    if (visible) setName(initialName ?? "");
  }, [visible, initialName]);

  // RN'in <Modal>'ı Android'de bu ortamda üst köşe borderRadius'unu
  // klipsizlemiyor, o yüzden native Modal yerine ekranı kaplayan mutlak
  // konumlu düz bir View kullanılıyor; donanım geri tuşu elle bağlanıyor.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    onClose();
  }

  if (!visible) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(23,23,23,0.4)" }} />
      <View style={{ maxHeight: "80%" }}>
      <View
        style={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          backgroundColor: Colors.surfaceWarm,
        }}
      >
      <View
        style={{
          gap: 16,
          padding: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={Colors.surfaceTextMuted} />
          </Pressable>
          <Text className="text-base font-bold text-foreground">{isRenaming ? "Yeniden Adlandır" : "Koleksiyon Oluştur"}</Text>
          <View style={{ width: 20 }} />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Koleksiyon İsmi</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Örn. Kahvaltılıklarım"
            placeholderTextColor={Colors.surfaceTextMuted}
            className="rounded-xl border border-surface-border bg-surface-card px-3 py-2.5 text-sm text-foreground"
          />
          <Text className="text-xs text-surface-text-muted">
            Oluşturduğun koleksiyonu favorilerini gruplamak için istediğin zaman kullanabilirsin.
          </Text>
        </View>

        <ScrollView contentContainerClassName="gap-2">
          <Text className="text-xs font-semibold text-surface-text-muted">Önerilen İsimler</Text>
          {SUGGESTED_NAMES.map((suggestion) => {
            const isSelected = name === suggestion;
            return (
              <Pressable key={suggestion} onPress={() => setName(suggestion)} className="flex-row items-center gap-2 py-1.5">
                <View
                  style={{
                    height: 18,
                    width: 18,
                    borderRadius: 9,
                    borderWidth: 1.5,
                    borderColor: isSelected ? Colors.brandOrange : Colors.surfaceBorder,
                    backgroundColor: isSelected ? Colors.brandOrange : "transparent",
                  }}
                  className="items-center justify-center"
                >
                  {isSelected && <Check size={11} color="#ffffff" />}
                </View>
                <Text className="text-sm text-foreground">{suggestion}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={handleCreate}
          style={{ opacity: name.trim() ? 1 : 0.5 }}
          className="items-center rounded-full bg-brand-orange py-3.5"
        >
          <Text className="text-sm font-semibold text-white">{isRenaming ? "Kaydet" : "Koleksiyon Oluştur"}</Text>
        </Pressable>
      </View>
      </View>
      </View>
    </View>
  );
}
