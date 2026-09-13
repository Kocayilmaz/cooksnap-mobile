import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

/** ChatGPT'nin başlık ikonlarındaki gibi yarı saydam/buzlu cam görünümlü
 * yuvarlak buton — Chat ekranının kayan (floating) hamburger/yeni sohbet/
 * seçenekler butonları için (bkz. app/(tabs)/chat.tsx). */
export default function BlurIconButton({
  onPress,
  children,
  size = 40,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[
        {
          borderRadius: size / 2,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.6)",
        },
        style,
      ]}
    >
      <BlurView
        intensity={50}
        tint="light"
        style={{ height: size, width: size, alignItems: "center", justifyContent: "center" }}
      >
        {children}
      </BlurView>
    </Pressable>
  );
}
