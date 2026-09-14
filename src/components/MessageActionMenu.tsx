import { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, Share, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Copy, Share2 } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

interface MessageActionMenuProps {
  visible: boolean;
  onClose: () => void;
  text: string;
  /** Uzun basılan noktanın ekran koordinatı — balonun kopyası ve menü oraya
   * yakın açılır. */
  anchor: { x: number; y: number } | null;
}

const MENU_WIDTH = 190;
const BUBBLE_MAX_WIDTH = 260;

/**
 * Mesaj balonuna uzun basınca açılan Kopyala/Paylaş menüsü — ChatGPT'nin
 * uzun-basma davranışının karşılığı (bkz. app/(tabs)/chat.tsx, kullanıcının
 * kendi mesaj balonlarında kullanılıyor). Balonun kendisi biraz büyütülüp
 * öne çıkarılmış bir kopyası olarak gösteriliyor, arkaplan koyu+bulanık,
 * altındaki seçenek çubuğu da buzlu cam görünümünde — dokunuşta titreşim
 * (bkz. Haptics.impactAsync, chat.tsx'teki onLongPress) telefonun kendi
 * dokunsal geri bildirimi değil, biz tetikliyoruz.
 */
export default function MessageActionMenu({ visible, onClose, text, anchor }: MessageActionMenuProps) {
  const { width, height } = Dimensions.get("window");
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
  const left = Math.min(Math.max(anchor.x - BUBBLE_MAX_WIDTH, 12), width - BUBBLE_MAX_WIDTH - 12);
  const top = Math.min(Math.max(anchor.y - 70, 60), height - 260);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: progress }}>
          <BlurView intensity={35} tint="dark" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            left,
            top,
            width: BUBBLE_MAX_WIDTH,
            gap: 10,
            opacity: progress,
            transform: [
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          }}
        >
          <View
            style={{
              alignSelf: "flex-end",
              maxWidth: "100%",
              shadowColor: "#000",
              shadowOpacity: 0.25,
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
              borderRadius: 16,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
          >
            <BlurView intensity={70} tint="light">
              <Pressable onPress={handleCopy} className="flex-row items-center gap-2 px-4 py-3">
                <Copy size={16} color={Colors.foreground} />
                <Text className="text-sm font-medium text-foreground">Kopyala</Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: "rgba(23,23,23,0.08)" }} />
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
