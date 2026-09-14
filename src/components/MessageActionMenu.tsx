import { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, Share, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Copy, Share2 } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { formatMessageTimestamp } from "@/lib/relativeTime";

interface MessageActionMenuProps {
  visible: boolean;
  onClose: () => void;
  text: string;
  createdAt: number;
  /** Uzun basılan noktanın ekran koordinatı — grup (tarih/balon/menü) oraya
   * yakın açılır. */
  anchor: { x: number; y: number } | null;
}

const MENU_WIDTH = 190;
const GROUP_WIDTH = 260;

/**
 * Mesaj balonuna uzun basınca açılan Kopyala/Paylaş menüsü — ChatGPT'nin
 * uzun-basma davranışının karşılığı (bkz. app/(tabs)/chat.tsx, kullanıcının
 * kendi mesaj balonlarında kullanılıyor). Arkaplan tamamen koyu+bulanık
 * olduğu için asıl ekrandaki içerik hiç görünmüyor — üstte tarih, ortada
 * balonun büyütülmüş kopyası, altında buzlu cam görünümünde seçenekler tek
 * bir grup halinde diziliyor (ChatGPT'nin "Yesterday, 15:14" + balon + menü
 * düzeninin karşılığı). Dokunuşta titreşim (bkz. Haptics.impactAsync,
 * chat.tsx'teki onLongPress) telefonun kendi dokunsal geri bildirimi değil,
 * biz tetikliyoruz.
 */
export default function MessageActionMenu({ visible, onClose, text, createdAt, anchor }: MessageActionMenuProps) {
  const { height } = Dimensions.get("window");
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
    }).start();
  }, [visible, progress]);

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
  const top = Math.min(Math.max(anchor.y - 130, 60), height - 320);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: progress }}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,10,8,0.78)" }} />
          <BlurView intensity={40} tint="dark" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            right: 16,
            top,
            width: GROUP_WIDTH,
            gap: 8,
            opacity: progress,
            transform: [
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          }}
        >
          <Text style={{ alignSelf: "flex-end", color: "rgba(255,255,255,0.75)" }} className="text-xs font-medium">
            {formatMessageTimestamp(createdAt)}
          </Text>

          <View
            style={{
              alignSelf: "flex-end",
              maxWidth: "100%",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
            className="rounded-2xl rounded-br-md bg-brand-orange px-4 py-2.5"
          >
            <Text className="text-sm text-white">{text}</Text>
          </View>

          <View
            style={{
              alignSelf: "flex-end",
              width: MENU_WIDTH,
              marginTop: 4,
              borderRadius: 16,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
          >
            <BlurView intensity={80} tint="light">
              <Pressable onPress={handleCopy} className="flex-row items-center gap-2 px-4 py-3">
                <Copy size={16} color={Colors.foreground} />
                <Text className="text-sm font-medium text-foreground">Kopyala</Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: "rgba(23,23,23,0.1)" }} />
              <Pressable onPress={handleShare} className="flex-row items-center gap-2 px-4 py-3">
                <Share2 size={16} color={Colors.foreground} />
                <Text className="text-sm font-medium text-foreground">Paylaş</Text>
              </Pressable>
            </BlurView>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
