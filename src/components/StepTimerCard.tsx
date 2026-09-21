import { Pressable, Text, View } from "react-native";
import { Play, Timer as TimerIcon } from "lucide-react-native";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatTimerDuration } from "@/lib/cookingTimerUtils";
import { Colors } from "@/constants/theme";

/** Bir tarif adımında süre ifadesi varsa (ör. "10 dakika") altında gösterilen
 * zamanlayıcı kartı — "Zamanlayıcıyı Başlat"a basınca uygulamanın tek
 * paylaşılan mutfak zamanlayıcısı (bkz. cookingTimerSlice) o süreyle başlar.
 * `isActive` true olduğunda (bu adımın zamanlayıcısı az önce başlatıldıysa)
 * canlı geri sayımı gösterir, değilse adımın kendi süresini sabit gösterir.
 * Hem meal/[id].tsx (Supabase/TheMealDB tarifleri) hem RecipeMessageCard.tsx
 * (sohbette AI'ın ürettiği tarifler) aynı görünümü kullanıyor. */
export default function StepTimerCard({
  minutes,
  isActive,
  onStart,
}: {
  minutes: number;
  isActive: boolean;
  onStart: () => void;
}) {
  const { remainingSeconds } = useAppSelector((state) => state.cookingTimer);
  const displaySeconds = isActive ? remainingSeconds : minutes * 60;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: 12,
        backgroundColor: Colors.surfaceWarm,
        padding: 10,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 }}>
          <TimerIcon size={13} color={Colors.brandOrangeDark} />
          <Text style={{ flexShrink: 1 }} className="text-xs font-medium text-surface-text-muted">
            {minutes} Dakika Zamanlayıcı
          </Text>
        </View>
        <Pressable
          onPress={onStart}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            borderRadius: 999,
            backgroundColor: Colors.brandOrange,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Play size={11} color="#ffffff" />
          <Text className="text-xs font-semibold text-white">Zamanlayıcıyı Başlat</Text>
        </Pressable>
      </View>
      <Text style={{ color: Colors.brandOrangeDark, fontVariant: ["tabular-nums"] }} className="text-lg font-bold">
        {formatTimerDuration(displaySeconds)}
      </Text>
    </View>
  );
}
