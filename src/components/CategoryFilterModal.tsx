import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { CATEGORY_LABELS_TR, FEATURED_CATEGORY_ORDER } from "@/lib/mealdb/categoryMeta";
import { Colors } from "@/constants/theme";

interface CategoryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selected: string[];
  onApply: (categories: string[]) => void;
}

const ALL_CATEGORIES = FEATURED_CATEGORY_ORDER;

/** Kaydedilen tarifleri kategoriye göre süzmek için — bir alışveriş
 * uygulamasının kategori filtre modalına benzer: arama + iki sütun
 * onay kutusu listesi + Temizle/Uygula (bkz. favorites.tsx). */
export default function CategoryFilterModal({ visible, onClose, selected, onApply }: CategoryFilterModalProps) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setSearch("");
    }
  }, [visible, selected]);

  const term = search.trim().toLowerCase();
  const visibleCategories = ALL_CATEGORIES.filter((category) => CATEGORY_LABELS_TR[category].toLowerCase().includes(term));

  function toggle(category: string) {
    setDraft((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(23,23,23,0.4)" }} />
      <View
        style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%" }}
        className="gap-4 bg-surface-warm p-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-foreground">Kategori</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={Colors.surfaceTextMuted} />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-2">
          <Search size={14} color={Colors.surfaceTextMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Kategori ara"
            placeholderTextColor={Colors.surfaceTextMuted}
            className="flex-1 text-sm text-foreground"
          />
        </View>

        <ScrollView contentContainerClassName="gap-3">
          <View className="flex-row flex-wrap gap-3">
            {visibleCategories.map((category) => {
              const isChecked = draft.includes(category);
              return (
                <Pressable key={category} onPress={() => toggle(category)} style={{ width: "47%" }} className="flex-row items-center gap-2">
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
                  <Text className="flex-1 text-sm text-foreground">{CATEGORY_LABELS_TR[category]}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setDraft([])}
            className="flex-1 items-center rounded-full border border-surface-border py-3"
          >
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
    </Modal>
  );
}
