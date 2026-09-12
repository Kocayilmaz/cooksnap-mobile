import { Alert, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { MessageCircle, Pin, PinOff, SquarePen, Star, Trash2, X } from "lucide-react-native";
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
}

function HistoryRow({
  entry,
  onPress,
  disabled,
}: {
  entry: HistoryEntry;
  onPress: () => void;
  disabled?: boolean;
}) {
  const dispatch = useAppDispatch();

  function handleDelete() {
    Alert.alert("Sohbeti sil", "Bu sohbeti silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => dispatch(deleteHistoryEntry(entry.id)) },
    ]);
  }

  return (
    <View className="flex-row items-center gap-1">
      <Pressable onPress={onPress} disabled={disabled} style={{ minWidth: 0 }} className="flex-1 py-1.5">
        <Text numberOfLines={1} className="text-sm font-medium text-foreground">
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

/** ne-pisirsem'deki ChatSidebar.tsx'in mobil karşılığı. Kendi başına açılıp
 * kapanmıyor/animasyon yapmıyor — Chat ekranı (bkz. app/(tabs)/chat.tsx) bu
 * paneli hep aynı yerde (solda, sabit genişlikte, DRAWER_WIDTH) tutuyor ve
 * ana içeriği ChatGPT'deki gibi Animated.View ile sağa "iterek" açığa
 * çıkarıyor — bu yüzden burada Modal/backdrop/kendi animasyonu yok. Yeniden
 * adlandırma (rename) da yok — pin/sil var. Arama kutusu da yok, geçmiş kısa
 * olduğu için şimdilik gerek görülmedi. */
export default function ChatSidebarDrawer({ onClose, onNewChat, onSelectEntry, disabled }: ChatSidebarDrawerProps) {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state) => state.history);

  const favorites = history.filter((entry) => entry.isFavorite);
  const others = history.filter((entry) => !entry.isFavorite);

  function handleClearOthers() {
    if (others.length === 0) return;
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
      <ScrollView contentContainerClassName="gap-4 p-4" style={{ paddingTop: 48 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-foreground">Sohbetler</Text>
          <Pressable onPress={onClose} hitSlop={8} style={{ height: 32, width: 32 }} className="items-center justify-center">
            <X size={18} color={Colors.surfaceTextMuted} />
          </Pressable>
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

        {favorites.length > 0 && (
          <View className="gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <Star size={12} color={Colors.surfaceTextMuted} />
              <Text style={{ textTransform: "uppercase" }} className="text-xs font-bold text-surface-text-muted">
                Sohbet Favorileri
              </Text>
            </View>
            {favorites.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                disabled={disabled}
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
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <MessageCircle size={12} color={Colors.surfaceTextMuted} />
                <Text style={{ textTransform: "uppercase" }} className="text-xs font-bold text-surface-text-muted">
                  Sohbetler
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
                onPress={() => {
                  onSelectEntry(entry);
                  onClose();
                }}
              />
            ))}
          </View>
        )}

        {favorites.length === 0 && others.length === 0 && (
          <Text className="text-xs text-surface-text-muted">Henüz bir sohbet geçmişin yok.</Text>
        )}

        <SidebarCookingTimer />
      </ScrollView>
    </View>
  );
}
