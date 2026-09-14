import { Dimensions, Modal, Pressable, Share, Text, View } from "react-native";
import { Copy, Share2 } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

interface MessageActionMenuProps {
  visible: boolean;
  onClose: () => void;
  text: string;
  /** Uzun basılan noktanın ekran koordinatı — menü oraya yakın açılır. */
  anchor: { x: number; y: number } | null;
}

const MENU_WIDTH = 168;

/** Mesaj balonuna uzun basınca açılan Kopyala/Paylaş menüsü — WhatsApp/
 * Messages'taki uzun-basma davranışının karşılığı (bkz. app/(tabs)/chat.tsx,
 * kullanıcının kendi mesaj balonlarında kullanılıyor). */
export default function MessageActionMenu({ visible, onClose, text, anchor }: MessageActionMenuProps) {
  const { width, height } = Dimensions.get("window");

  async function handleCopy() {
    onClose();
    await Clipboard.setStringAsync(text);
    notify("Metin panoya kopyalandı");
  }

  async function handleShare() {
    onClose();
    try {
      await Share.share({ message: text });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  if (!anchor) return null;
  const left = Math.min(Math.max(anchor.x - MENU_WIDTH / 2, 12), width - MENU_WIDTH - 12);
  const top = Math.min(Math.max(anchor.y - 96, 40), height - 120);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <View
          style={{
            position: "absolute",
            left,
            top,
            width: MENU_WIDTH,
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
          <Pressable onPress={handleCopy} className="flex-row items-center gap-2 px-4 py-3">
            <Copy size={16} color={Colors.foreground} />
            <Text className="text-sm font-medium text-foreground">Kopyala</Text>
          </Pressable>
          <Pressable onPress={handleShare} className="flex-row items-center gap-2 px-4 py-3">
            <Share2 size={16} color={Colors.foreground} />
            <Text className="text-sm font-medium text-foreground">Paylaş</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
