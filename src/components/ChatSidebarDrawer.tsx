import { useState } from "react";
import { Alert, Dimensions, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle, Pin, PinOff, Search, SquarePen, Star, Trash2 } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  deleteHistoryEntry,
  historyEntryTitle,
  setHistory,
  summarizeHistoryEntry,
  toggleHistoryFavorite,
  type HistoryEntry,
} from "@/lib/redux/historySlice";
import { Colors } from "@/constants/theme";
import SidebarCookingTimer from "@/components/SidebarCookingTimer";

export const DRAWER_WIDTH = Math.min(320, Dimensions.get("window").width * 0.82);

interface ChatSidebarDrawerProps {
  onClose: () => void;
  onNewChat: () => void;
  onSelectEntry: (entry: HistoryEntry) => void;
  disabled?: boolean;
  /** Chat ekranında o an açık olan sohbetin id'si — listede o satırı
   * vurgulamak için (bkz. HistoryRow'daki isSelected). */
  selectedEntryId?: string | null;
}

function HistoryRow({
  entry,
  onPress,
  disabled,
  isSelected,
}: {
  entry: HistoryEntry;
  onPress: () => void;
  disabled?: boolean;
  isSelected?: boolean;
}) {
  const dispatch = useAppDispatch();

  function handleDelete() {
    Alert.alert("Sohbeti sil", "Bu sohbeti silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => dispatch(deleteHistoryEntry(entry.id)) },
    ]);
  }

  return (
    <View style={{ position: "relative" }} className="flex-row items-center gap-1">
      {isSelected && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -6,
            bottom: -6,
            left: -8,
            right: -8,
            backgroundColor: "rgba(242,96,12,0.12)",
            borderRadius: 20,
          }}
        />
      )}
      <Pressable onPress={onPress} disabled={disabled} style={{ minWidth: 0 }} className="flex-1 py-1.5">
        <Text
          numberOfLines={1}
          style={isSelected ? { color: Colors.brandOrangeDark } : undefined}
          className={`text-sm ${isSelected ? "font-bold" : "font-medium text-foreground"}`}
        >
          {historyEntryTitle(entry)}
        </Text>
        <Text numberOfLines={1} className="text-xs text-surface-text-muted">
          {summarizeHistoryEntry(entry)}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => dispatch(toggleHistoryFavorite(entry.id))}
        hitSlop={8}
        style={{ height: 28, width: 28 }}
        className="items-center justify-center"
      >
        {entry.isFavorite ? (
          <PinOff size={14} color={Colors.brandOrangeDark} />
        ) : (
          <Pin size={14} color={Colors.surfaceTextMuted} />
        )}
      </Pressable>
      <Pressable onPress={handleDelete} hitSlop={8} style={{ height: 28, width: 28 }} className="items-center justify-center">
        <Trash2 size={14} color={Colors.stateError} />
      </Pressable>
    </View>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: string }) {
  return (
    <View style={{ marginTop: 4 }} className="flex-row items-center gap-1.5">
      {icon}
      <Text style={{ textTransform: "uppercase" }} className="text-xs font-bold text-surface-text-muted">
        {children}
      </Text>
    </View>
  );
}

/** ne-pisirsem'deki ChatSidebar.tsx'in mobil karşılığı. Kendi başına açılıp
 * kapanmıyor/animasyon yapmıyor — Chat ekranı (bkz. app/(tabs)/chat.tsx) bu
 * paneli hep aynı yerde (solda, sabit genişlikte, DRAWER_WIDTH) tutuyor ve
 * ana içeriği ChatGPT'deki gibi Animated.View ile sağa "iterek" açığa
 * çıkarıyor. Üstte logo + arama, ortada kaydırılabilir favoriler/geçmiş
 * listesi, en altta sabit (kaydırmayan) mutfak zamanlayıcısı — kapatma
 * artık dışarı (ana ekrana) dokunarak yapılıyor, ayrı bir X butonu yok. */
export default function ChatSidebarDrawer({ onClose, onNewChat, onSelectEntry, disabled, selectedEntryId }: ChatSidebarDrawerProps) {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state) => state.history);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const term = searchTerm.trim().toLowerCase();
  const visible = term
    ? history.filter(
        (entry) =>
          historyEntryTitle(entry).toLowerCase().includes(term) ||
          summarizeHistoryEntry(entry).toLowerCase().includes(term),
      )
    : history;
  const favorites = visible.filter((entry) => entry.isFavorite);
  const others = visible.filter((entry) => !entry.isFavorite);

  function handleClearOthers() {
    const allOthers = history.filter((entry) => !entry.isFavorite);
    if (allOthers.length === 0) return;
    Alert.alert("Geçmişi temizle", "Sabitlenmeyen tüm sohbet geçmişini silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Temizle",
        style: "destructive",
        onPress: () => dispatch(setHistory(history.filter((entry) => entry.isFavorite))),
      },
    ]);
  }

  return (
    <View style={{ width: DRAWER_WIDTH }} className="h-full bg-surface-warm">
      <View style={{ paddingTop: 48 }} className="gap-4 px-4">
        <View className="flex-row items-center justify-between">
          {searchOpen ? (
            <View className="flex-1 flex-row items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-3 py-1.5">
              <Search size={14} color={Colors.surfaceTextMuted} />
              <TextInput
                autoFocus
                value={searchTerm}
                onChangeText={setSearchTerm}
                onBlur={() => {
                  if (!searchTerm.trim()) setSearchOpen(false);
                }}
                placeholder="Sohbetlerde ara"
                placeholderTextColor={Colors.surfaceTextMuted}
                className="flex-1 text-xs text-foreground"
              />
            </View>
          ) : (
            <Image
              source={require("../../assets/images/cooksnap-logo.png")}
              style={{ width: 120, height: 36 }}
              contentFit="contain"
            />
          )}
          {!searchOpen && (
            <Pressable
              onPress={() => setSearchOpen(true)}
              hitSlop={8}
              style={{ height: 32, width: 32 }}
              className="items-center justify-center rounded-full border border-surface-border bg-surface-card"
            >
              <Search size={16} color={Colors.surfaceTextMuted} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => {
            onNewChat();
            onClose();
          }}
          disabled={disabled}
          className="flex-row items-center justify-center gap-2 rounded-full bg-brand-orange px-4 py-2.5"
        >
          <SquarePen size={16} color="#ffffff" />
          <Text className="text-sm font-semibold text-white">Yeni sohbet</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
      <ScrollView className="flex-1" contentContainerClassName="gap-2 p-4" style={{ marginTop: 4 }}>
        {favorites.length > 0 && (
          <View className="gap-1.5">
            <SectionLabel icon={<Star size={12} color={Colors.surfaceTextMuted} />}>Sohbet Favorileri</SectionLabel>
            {favorites.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                disabled={disabled}
                isSelected={entry.id === selectedEntryId}
                onPress={() => {
                  onSelectEntry(entry);
                  onClose();
                }}
              />
            ))}
          </View>
        )}

        {others.length > 0 && (
          <View className="gap-1.5">
            <View style={{ marginTop: 4 }} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <MessageCircle size={12} color={Colors.surfaceTextMuted} />
                <Text style={{ textTransform: "uppercase" }} className="text-xs font-bold text-surface-text-muted">
                  Son Sohbetler
                </Text>
              </View>
              <Pressable onPress={handleClearOthers}>
                <Text className="text-xs text-surface-text-muted">Temizle</Text>
              </Pressable>
            </View>
            {others.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                disabled={disabled}
                isSelected={entry.id === selectedEntryId}
                onPress={() => {
                  onSelectEntry(entry);
                  onClose();
                }}
              />
            ))}
          </View>
        )}

        {favorites.length === 0 && others.length === 0 && (
          <Text className="text-xs text-surface-text-muted">
            {term ? "Eşleşen bir sohbet bulunamadı." : "Henüz bir sohbet geçmişin yok."}
          </Text>
        )}
      </ScrollView>

        {/* Listenin en altındaki kesik satırı bulanıklaştırıp "daha var, kaydır"
         * hissi veriyor — biraz yukarı kaydırınca o satır tam ve net görünür. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,250,245,0)", Colors.surfaceWarm]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40 }}
        />
      </View>

      <View
        style={{ borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: 12, paddingBottom: 16 }}
        className="px-4"
      >
        <SidebarCookingTimer />
      </View>
    </View>
  );
}
