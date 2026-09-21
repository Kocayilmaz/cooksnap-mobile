import { useState } from "react";
import { Dimensions, Text, View } from "react-native";
import { useAppDispatch } from "@/lib/redux/hooks";
import { startWithMinutes } from "@/lib/redux/cookingTimerSlice";
import { EQUIPMENT_LABELS } from "@/lib/redux/equipmentSlice";
import { clampMinutes, extractDurationMinutes } from "@/lib/cookingTimerUtils";
import StepTimerCard from "@/components/StepTimerCard";
import { Colors } from "@/constants/theme";
import type { RecipeSuggestion } from "@/lib/types/recipe";

const MIN_MINUTES = 1;
const MAX_MINUTES = 180;
// "92%" yüzde string'i bu baloncukta beklenmedik şekilde ekran genişliğinin
// çok daha azına çözümleniyordu (canlı test edilip doğrulandı — muhtemelen
// yüzde genişliğin dayandığı üst View'in kendi genişliği bu noktada henüz
// kesinleşmemiş oluyor). Piksel değeri kullanmak bu belirsizliği ortadan
// kaldırıyor.
const MAX_BUBBLE_WIDTH = Dimensions.get("window").width * 0.92;

/**
 * ne-pisirsem'deki RecipeMessageCard'ın sade karşılığı — video embed (YouTube)
 * bu ilk sürümde yok. Kopyalama/indirme/yıldızlama artık kart üzerinde değil,
 * ChatGPT'deki gibi mesajın altında tek bir eylem çubuğunda (bkz.
 * ChatMessageActions, app/(tabs)/chat.tsx).
 *
 * Adım listesi, meal/[id].tsx'teki (Supabase/TheMealDB tarifleri) numaralı
 * daire + kutu zamanlayıcı tasarımıyla aynı — tutarlılık için StepTimerCard
 * paylaşılıyor. Bir adımda süre ifadesi varsa (ör. "Fırında 10 dakika
 * pişirin") altına bir zamanlayıcı kartı ekleniyor; "Zamanlayıcıyı Başlat"a
 * basınca sidebar'daki mutfak zamanlayıcısı (bkz. SidebarCookingTimer.tsx)
 * o süreyle doğrudan başlıyor.
 */
export default function RecipeMessageCard({
  recipe,
  onStartTimer,
}: {
  recipe: RecipeSuggestion;
  /** Zamanlayıcı başlatılınca çağrılır — chat.tsx bunu sidebar'ı açmak için kullanıyor. */
  onStartTimer?: () => void;
}) {
  const dispatch = useAppDispatch();
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  function handleStartTimer(stepIndex: number, minutes: number) {
    dispatch(startWithMinutes(clampMinutes(minutes, MIN_MINUTES, MAX_MINUTES)));
    setActiveStepIndex(stepIndex);
    onStartTimer?.();
  }

  return (
    // maxWidth/alignSelf bilerek inline style'da — bu değerler className
    // olarak yazılınca (max-w-[92%] self-start) alttaki iç içe flex
    // yapılarıyla etkileşip metin yüksekliğinin yanlış ölçülmesine yol
    // açıyordu (bkz. StepTimerCard eklenmeden önce de benzer bir bug canlı
    // test edilip inline style'a geçilerek çözülmüştü).
    <View
      style={{ maxWidth: MAX_BUBBLE_WIDTH, alignSelf: "flex-start", gap: 12 }}
      className="rounded-2xl border border-surface-border bg-surface-card p-4"
    >
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-foreground">{recipe.title}</Text>
        <Text className="text-xs text-surface-text-muted">{EQUIPMENT_LABELS[recipe.equipment]}</Text>
      </View>
      <View style={{ gap: 12 }}>
        {recipe.steps.map((step, index) => {
          const minutes = extractDurationMinutes(step);
          return (
            // Daire, metnin flex-row+flex:1 ile aynı satırda yarıştığı
            // sürümlerde metnin sarılmış yüksekliğinin yanlış ölçülmesine yol
            // açıyordu (canlı test edilip doğrulandı, birkaç kez). Daireyi
            // mutlak konumla metin akışının tamamen dışına çıkarmak (bu View
            // "position: relative" + paddingLeft, daire "position: absolute")
            // bu ölçüm etkileşimini kökten ortadan kaldırıyor — metin artık
            // hiçbir sıra kardeşiyle genişlik paylaşmıyor.
            <View key={index} style={{ position: "relative", paddingLeft: 28 }}>
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.brandOrange,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: Colors.brandOrangeDark, fontSize: 10 }} className="font-bold">
                  {index + 1}
                </Text>
              </View>
              <Text className="text-sm text-surface-text-muted">{step}</Text>
              {minutes !== null && (
                <View style={{ marginTop: 6 }}>
                  <StepTimerCard
                    minutes={minutes}
                    isActive={activeStepIndex === index}
                    onStart={() => handleStartTimer(index, minutes)}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
