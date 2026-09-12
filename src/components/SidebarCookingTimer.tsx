import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, Vibration, View } from "react-native";
import { Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react-native";
import { clampMinutes, formatTimerDuration } from "@/lib/cookingTimerUtils";
import { Colors } from "@/constants/theme";

const PRESET_MINUTES = [5, 10, 20];
const DEFAULT_MINUTES = PRESET_MINUTES[0];
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

/** ne-pisirsem'deki components/SidebarCookingTimer.tsx'in mobil karşılığı —
 * daraltılmış (collapsed) hali yok, mobilde sidebar zaten ya tamamen açık ya
 * tamamen kapalı (bkz. ChatSidebarDrawer). Zil sesi yerine (Web Audio API RN'de
 * yok) süre dolunca kısa bir titreşim (Vibration.vibrate) kullanılıyor. */
export default function SidebarCookingTimer() {
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_MINUTES * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(String(DEFAULT_MINUTES));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          Vibration.vibrate(400);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  function applyMinutes(minutes: number) {
    const clamped = clampMinutes(minutes, MIN_MINUTES, MAX_MINUTES);
    setTotalSeconds(clamped * 60);
    setRemainingSeconds(clamped * 60);
    setManualMinutes(String(clamped));
  }

  function handleSelectPreset(minutes: number) {
    if (isRunning) return;
    applyMinutes(minutes);
  }

  function handleManualMinutesCommit() {
    if (isRunning) return;
    const parsed = Number(manualMinutes);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setManualMinutes(String(totalSeconds / 60));
      return;
    }
    applyMinutes(Math.round(parsed));
  }

  function handleToggle() {
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  }

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: 12 }} className="gap-2">
      <View className="flex-row items-center gap-1.5">
        <TimerIcon size={12} color={Colors.surfaceTextMuted} />
        <Text style={{ textTransform: "uppercase" }} className="text-xs font-bold text-surface-text-muted">
          Mutfak zamanlayıcısı
        </Text>
      </View>

      <Text
        style={{ fontVariant: ["tabular-nums"], color: Colors.brandOrangeDark }}
        className="text-center text-lg font-bold"
      >
        {formatTimerDuration(remainingSeconds)}
      </Text>

      {remainingSeconds === 0 && !isRunning && (
        <Text className="text-center text-xs font-medium text-state-error">Süre doldu!</Text>
      )}

      <View className="flex-row gap-1">
        {PRESET_MINUTES.map((minutes) => {
          const active = totalSeconds === minutes * 60;
          return (
            <Pressable
              key={minutes}
              onPress={() => handleSelectPreset(minutes)}
              disabled={isRunning}
              style={{
                borderWidth: 1,
                borderColor: active ? Colors.brandOrange : Colors.surfaceBorder,
                borderRadius: 6,
                paddingVertical: 4,
              }}
              className={`flex-1 items-center ${active ? "bg-brand-orange" : "bg-surface-warm"}`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-white" : "text-foreground"}`}>{minutes} dk</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center gap-1">
        <TextInput
          value={manualMinutes}
          onChangeText={setManualMinutes}
          onBlur={handleManualMinutesCommit}
          onSubmitEditing={handleManualMinutesCommit}
          editable={!isRunning}
          keyboardType="number-pad"
          style={{ borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 }}
          className="flex-1 bg-surface-warm text-center text-xs font-semibold text-foreground"
        />
        <Text className="text-xs text-surface-text-muted">dk</Text>
      </View>

      <View className="flex-row gap-1">
        <Pressable
          onPress={handleToggle}
          style={{ height: 28, borderRadius: 6 }}
          className="flex-1 flex-row items-center justify-center gap-1 bg-brand-orange"
        >
          {isRunning ? <Pause size={12} color="#ffffff" /> : <Play size={12} color="#ffffff" />}
          <Text className="text-xs font-semibold text-white">{isRunning ? "Duraklat" : "Başlat"}</Text>
        </Pressable>
        <Pressable
          onPress={handleReset}
          style={{ height: 28, width: 28, borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 6 }}
          className="items-center justify-center"
        >
          <RotateCcw size={12} color={Colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}
