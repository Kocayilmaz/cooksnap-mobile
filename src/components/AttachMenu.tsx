import { Modal, Pressable, Text, View } from "react-native";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { Colors } from "@/constants/theme";

interface AttachMenuProps {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
}

/** "+" butonuna basınca açılan Kamera/Photos seçeneği (bkz. Chat ekranındaki
 * takip mesajı yazma barı). */
export default function AttachMenu({ visible, onClose, onPickCamera, onPickLibrary }: AttachMenuProps) {
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
            bottom: 84,
            left: 16,
            width: 180,
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
          <Pressable onPress={() => run(onPickCamera)} className="flex-row items-center gap-2 px-4 py-3">
            <Camera size={16} color={Colors.foreground} />
            <Text className="text-sm font-medium text-foreground">Kamera</Text>
          </Pressable>
          <Pressable onPress={() => run(onPickLibrary)} className="flex-row items-center gap-2 px-4 py-3">
            <ImageIcon size={16} color={Colors.foreground} />
            <Text className="text-sm font-medium text-foreground">Photos</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
