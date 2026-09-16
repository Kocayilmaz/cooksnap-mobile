import { useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { Colors } from "@/constants/theme";

export interface ChecklistOption {
  key: string;
  label: string;
}

interface ChecklistFilterModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: ChecklistOption[];
  selected: string[];
  onApply: (keys: string[]) => void;
  /** Belirtilirse arama kutusu gösterilir (bkz. Kategori filtresi — az
   * sayıda seçenekli Ekipman/Kişi Sayısı filtrelerinde gerek yok). */
  searchable?: boolean;
}

/** Onay kutulu, arama + Temizle/Uygula düzenindeki genel filtre modalı —
 * Kategori, Ekipman ve Kişi Sayısı filtrelerinin ortak iskeleti (bkz.
 * favorites.tsx). */
export default function ChecklistFilterModal({
  visible,
  onClose,
  title,
  options,
  selected,
  onApply,
  searchable = true,
}: ChecklistFilterModalProps) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setSearch("");
    }
  }, [visible, selected]);

  const term = search.trim().toLowerCase();
  const visibleOptions = options.filter((option) => option.label.toLowerCase().includes(term));

  function toggle(key: string) {
    setDraft((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

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

  if (!visible) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(23,23,23,0.4)" }} />
      <View style={{ maxHeight: "75%" }}>
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
          <Text className="text-base font-bold text-foreground">{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={Colors.surfaceTextMuted} />
          </Pressable>
        </View>

        {searchable && (
          <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-2">
            <Search size={14} color={Colors.surfaceTextMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`${title} ara`}
              placeholderTextColor={Colors.surfaceTextMuted}
              className="flex-1 text-sm text-foreground"
            />
          </View>
        )}

        <ScrollView contentContainerClassName="gap-3">
          <View className="flex-row flex-wrap gap-3">
            {visibleOptions.map((option) => {
              const isChecked = draft.includes(option.key);
              return (
                <Pressable key={option.key} onPress={() => toggle(option.key)} style={{ width: "47%" }} className="flex-row items-center gap-2">
                  <View
                    style={{
                      height: 20,
                      width: 20,
                      borderRadius: 5,
                      borderWidth: 1.5,
                      borderColor: isChecked ? Colors.brandOrange : Colors.surfaceBorder,
                      backgroundColor: isChecked ? Colors.brandOrange : "transparent",
                    }}
                    className="items-center justify-center"
                  >
                    {isChecked && <Check size={13} color="#ffffff" />}
                  </View>
                  <Text className="flex-1 text-sm text-foreground">{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="flex-row gap-3">
          <Pressable onPress={() => setDraft([])} className="flex-1 items-center rounded-full border border-surface-border py-3">
            <Text className="text-sm font-semibold text-foreground">Temizle</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            className="flex-1 items-center rounded-full bg-brand-orange py-3"
          >
            <Text className="text-sm font-semibold text-white">Uygula</Text>
          </Pressable>
        </View>
      </View>
      </View>
      </View>
    </View>
  );
}
