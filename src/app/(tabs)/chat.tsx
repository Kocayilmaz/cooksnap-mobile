import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera, Send, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { EQUIPMENT_KEYS } from "@/lib/redux/equipmentSlice";
import { addHistoryEntry } from "@/lib/redux/historySlice";
import { FREE_USAGE_LIMIT, incrementUsage } from "@/lib/redux/usageCounterSlice";
import { requestRecipes as requestRecipesApi, ApiRequestError } from "@/lib/api/client";
import EquipmentSelector from "@/components/EquipmentSelector";
import PersonCountSelector from "@/components/PersonCountSelector";
import RecipeModeSelector from "@/components/RecipeModeSelector";
import RecipeMessageCard from "@/components/RecipeMessageCard";
import { Colors } from "@/constants/theme";
import type { ChatMessage } from "@/lib/types/chat";

function makeMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * ne-pisirsem'deki app/chat/page.tsx'in mobil karşılığı — sohbet geçmişi
 * sidecar'ı (ChatSidebar, "Sohbet Favorileri" dahil) burada henüz yok,
 * her açılışta yeni bir sohbetle başlanıyor; premium API anahtarı girme
 * ekranı (Profil) da henüz yok, o yüzden şu an her zaman ücretsiz mod.
 */
export default function ChatScreen() {
  // Anasayfadaki IngredientPicker /chat'e { ingredients } param'ıyla
  // yönlendiriyor (bkz. components/IngredientPicker.tsx) — web'deki
  // /chat?ingredients=... ile aynı akış.
  const params = useLocalSearchParams<{ ingredients?: string }>();
  const dispatch = useAppDispatch();
  const equipmentState = useAppSelector((state) => state.equipment);
  const personCount = useAppSelector((state) => state.personCount.value);
  const recipeMode = useAppSelector((state) => state.recipeMode.value);
  const userProfile = useAppSelector((state) => state.userProfile);
  const usageCount = useAppSelector((state) => state.usageCounter.count);
  const isFreeMode = true;
  const limitReached = isFreeMode && usageCount >= FREE_USAGE_LIMIT;

  const [photo, setPhoto] = useState<string | null>(null);
  const [ingredientsText, setIngredientsText] = useState(() => params.ingredients ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [followUpText, setFollowUpText] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const hasIngredientsText = ingredientsText.trim().length > 0;
  const hasStartedChat = messages.length > 0;
  const canSubmit = Boolean(photo) || hasIngredientsText;

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.base64) {
      setPhoto(`data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`);
    }
  }

  async function callApi(ingredientsDescription: string, photoDataUrl?: string) {
    const equipment = EQUIPMENT_KEYS.filter((key) => equipmentState[key]);
    if (equipment.length === 0) {
      throw new Error("En az bir ekipman seçmelisin.");
    }

    const { recipes } = await requestRecipesApi({
      photoDataUrl,
      ingredientsText: ingredientsDescription || undefined,
      personCount,
      equipment,
      mode: recipeMode,
      language: userProfile.language,
      country: userProfile.country.trim() || undefined,
    });

    dispatch(incrementUsage());
    return recipes;
  }

  async function handleSubmit() {
    if (!canSubmit || limitReached) return;
    setStatus("loading");
    setError(null);

    const userMessageText = hasIngredientsText
      ? ingredientsText.trim()
      : "Fotoğrafımdaki malzemelerle ne yapabilirim?";

    try {
      const recipes = await callApi(hasIngredientsText ? ingredientsText.trim() : "", photo ?? undefined);

      setMessages([
        { id: makeMessageId(), role: "user", text: userMessageText, createdAt: Date.now() },
        { id: makeMessageId(), role: "assistant", recipes, createdAt: Date.now() },
      ]);
      setStatus("idle");

      dispatch(
        addHistoryEntry({
          ingredientsText: hasIngredientsText ? ingredientsText.trim() : undefined,
          hadPhoto: Boolean(photo),
          personCount,
          equipment: EQUIPMENT_KEYS.filter((key) => equipmentState[key]),
          mode: recipeMode,
          recipeTitles: recipes.map((recipe) => recipe.title),
        }),
      );
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiRequestError || err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    }
  }

  async function handleFollowUpSend() {
    const trimmed = followUpText.trim();
    if (!trimmed || isSendingFollowUp || limitReached) return;

    const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
    const previousTitles = lastAssistantMessage?.recipes?.map((r) => r.title).join(", ");
    const combinedText = previousTitles ? `Önceki tarif(ler): ${previousTitles}. Ek istek: ${trimmed}` : trimmed;

    setIsSendingFollowUp(true);
    setFollowUpError(null);
    setMessages((prev) => [...prev, { id: makeMessageId(), role: "user", text: trimmed, createdAt: Date.now() }]);
    setFollowUpText("");

    try {
      const recipes = await callApi(combinedText);
      setMessages((prev) => [...prev, { id: makeMessageId(), role: "assistant", recipes, createdAt: Date.now() }]);
    } catch (err) {
      setFollowUpError(err instanceof ApiRequestError || err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setIsSendingFollowUp(false);
    }
  }

  function handleNewChat() {
    setPhoto(null);
    setIngredientsText("");
    setStatus("idle");
    setError(null);
    setMessages([]);
    setFollowUpText("");
    setFollowUpError(null);
  }

  if (hasStartedChat) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4">
          {messages.map((message) =>
            message.role === "user" ? (
              <View key={message.id} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-brand-orange px-4 py-2.5">
                <Text className="text-sm text-white">{message.text}</Text>
              </View>
            ) : (
              <View key={message.id} className="gap-3">
                {message.recipes?.map((recipe, index) => <RecipeMessageCard key={index} recipe={recipe} />)}
              </View>
            ),
          )}
          {isSendingFollowUp && (
            <View className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-surface-border bg-surface-card px-4 py-2.5">
              <Text className="text-sm text-surface-text-muted">Tarif hazırlanıyor…</Text>
            </View>
          )}
          {followUpError && <Text className="text-center text-sm text-state-error">{followUpError}</Text>}
        </ScrollView>

        <View className="flex-row items-center gap-2 border-t border-surface-border bg-surface-card p-3">
          <Pressable onPress={handleNewChat} className="rounded-full border border-surface-border px-3 py-2">
            <Text className="text-xs font-semibold text-surface-text-muted">Yeni sohbet</Text>
          </Pressable>
          <TextInput
            value={followUpText}
            onChangeText={setFollowUpText}
            placeholder="Ek bir şey sor ya da malzeme ekle…"
            className="flex-1 rounded-full border border-surface-border px-4 py-2.5 text-foreground"
            placeholderTextColor={Colors.surfaceTextMuted}
            editable={!isSendingFollowUp && !limitReached}
          />
          <Pressable
            onPress={handleFollowUpSend}
            disabled={isSendingFollowUp || limitReached || !followUpText.trim()}
            className="h-10 w-10 items-center justify-center rounded-full bg-brand-orange disabled:opacity-50"
          >
            <Send size={16} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-10">
        <View className="gap-1">
          <Text className="text-center text-2xl font-semibold text-brand-red">CookSnap</Text>
          <Text className="text-center text-sm text-surface-text-muted">
            Fotoğraf çek ya da malzemeleri yaz, elindekilere göre tarifini al.
          </Text>
        </View>

        {photo ? (
          <View className="items-center gap-2">
            <Image source={{ uri: photo }} className="h-48 w-48 rounded-2xl" />
            <Pressable onPress={() => setPhoto(null)} className="flex-row items-center gap-1">
              <X size={14} color={Colors.stateError} />
              <Text className="text-xs font-medium text-state-error">Fotoğrafı kaldır</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickPhoto}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-border py-6"
          >
            <Camera size={20} color={Colors.surfaceTextMuted} />
            <Text className="text-sm font-medium text-surface-text-muted">Fotoğraf seç</Text>
          </Pressable>
        )}

        <TextInput
          value={ingredientsText}
          onChangeText={setIngredientsText}
          placeholder="Elindeki malzemeleri yaz (örn. 2 yumurta, biraz peynir)"
          multiline
          className="min-h-20 rounded-xl border border-surface-border p-3 text-foreground"
          placeholderTextColor={Colors.surfaceTextMuted}
        />

        <PersonCountSelector />
        <EquipmentSelector />
        <RecipeModeSelector />

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || status === "loading" || limitReached}
          className="flex-row items-center justify-center gap-2 rounded-full bg-brand-orange py-3 disabled:opacity-50"
        >
          {status === "loading" ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-sm font-semibold text-white">Tarifi getir</Text>
          )}
        </Pressable>

        {limitReached ? (
          <Text className="text-center text-xs text-state-error">
            Ücretsiz mod limitine ulaştın ({usageCount}/{FREE_USAGE_LIMIT}).
          </Text>
        ) : (
          <Text className="text-center text-xs text-surface-text-muted">
            Ücretsiz modda kullanılan istek: {usageCount}/{FREE_USAGE_LIMIT}
          </Text>
        )}

        {error && <Text className="text-center text-sm text-state-error">{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
