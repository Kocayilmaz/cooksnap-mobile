import { Modal, Pressable, Text, View } from "react-native";
import { ImagePlus, Pin, PinOff, Search, Share2, Trash2 } from "lucide-react-native";
import { Colors } from "@/constants/theme";

interface ChatOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onFindInChat: () => void;
  onShare: () => void;
  onUploadPhoto: () => void;
  onDelete: () => void;
}

function MenuRow({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-2 px-4 py-3">
      {icon}
      <Text className={`text-sm font-medium ${destructive ? "text-state-error" : "text-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

/** ChatGPT'nin sohbet üstü "..." menüsünün sade bir alt kümesi (bkz.
 * ekran görüntüsü) — Pinle, Chat'in içinde bul, Paylaş, Foto yükle, Sil.
 * Sadece devam eden bir sohbet varken açılabiliyor (bkz. Chat ekranındaki
 * kullanım — yeni sohbet ekranında bu buton hiç gösterilmiyor). */
export default function ChatOptionsMenu({
  visible,
  onClose,
  isPinned,
  onTogglePin,
  onFindInChat,
  onShare,
  onUploadPhoto,
  onDelete,
}: ChatOptionsMenuProps) {
  function run(action: () => void) {
    onClose();
    action();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <View
          style={{
            position: "absolute",
            top: 92,
            right: 16,
            width: 220,
            borderRadius: 14,
            backgroundColor: Colors.surfaceCard,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
            overflow: "hidden",
          }}
        >
          <MenuRow
            icon={
              isPinned ? (
                <PinOff size={16} color={Colors.foreground} />
              ) : (
                <Pin size={16} color={Colors.foreground} />
              )
            }
            label={isPinned ? "Sabitlemeyi kaldır" : "Pinle"}
            onPress={() => run(onTogglePin)}
          />
          <MenuRow icon={<Search size={16} color={Colors.foreground} />} label="Chat'in içinde bul" onPress={() => run(onFindInChat)} />
          <MenuRow icon={<Share2 size={16} color={Colors.foreground} />} label="Paylaş" onPress={() => run(onShare)} />
          <MenuRow icon={<ImagePlus size={16} color={Colors.foreground} />} label="Foto yükle" onPress={() => run(onUploadPhoto)} />
          <MenuRow icon={<Trash2 size={16} color={Colors.stateError} />} label="Sil" destructive onPress={() => run(onDelete)} />
        </View>
      </Pressable>
    </Modal>
  );
}
