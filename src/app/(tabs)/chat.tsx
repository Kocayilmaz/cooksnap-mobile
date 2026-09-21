import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Camera, ChevronDown, Menu, Mic, MoreVertical, Plus, Search, Send, SquarePen, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { EQUIPMENT_KEYS, EQUIPMENT_LABELS, setEquipment, type Equipment } from "@/lib/redux/equipmentSlice";
import { addHistoryEntry, deleteHistoryEntry, toggleHistoryFavorite, type HistoryEntry } from "@/lib/redux/historySlice";
import { setPersonCount } from "@/lib/redux/personCountSlice";
import { setRecipeMode } from "@/lib/redux/recipeModeSlice";
import { FREE_USAGE_LIMIT, incrementUsage } from "@/lib/redux/usageCounterSlice";
import { requestRecipes as requestRecipesApi, ApiRequestError } from "@/lib/api/client";
import EquipmentSelector from "@/components/EquipmentSelector";
import PersonCountSelector from "@/components/PersonCountSelector";
import RecipeModeSelector from "@/components/RecipeModeSelector";
import RecipeMessageCard from "@/components/RecipeMessageCard";
import ChatMessageActions from "@/components/ChatMessageActions";
import MessageActionMenu from "@/components/MessageActionMenu";
import ChatSidebarDrawer, { DRAWER_WIDTH } from "@/components/ChatSidebarDrawer";
import BlurIconButton from "@/components/BlurIconButton";
import ChatOptionsMenu from "@/components/ChatOptionsMenu";
import AttachMenu from "@/components/AttachMenu";
import { notify } from "@/lib/notify";
import { Colors } from "@/constants/theme";
import type { ChatMessage } from "@/lib/types/chat";

function buildEquipmentState(selected: Equipment[]): Record<Equipment, boolean> {
  const state = {} as Record<Equipment, boolean>;
  for (const key of EQUIPMENT_KEYS) state[key] = selected.includes(key);
  return state;
}

function makeMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Hamburger her zaman sol üstte — devam eden bir sohbette sağda ayrıca
 * "yeni sohbet" (ikon) ve "..." (seçenekler) butonları var, yeni sohbet
 * formunda yalnızca hamburger gösteriliyor. ChatGPT'deki gibi ayrı bir
 * başlık çubuğu (arka plan/kenarlık) yok — butonlar içeriğin üzerinde
 * yüzüyor, buzlu cam görünümü BlurIconButton'dan geliyor. */
function ChatFloatingHeader({
  onMenuPress,
  hasStartedChat,
  onNewChat,
  onOptionsPress,
}: {
  onMenuPress: () => void;
  hasStartedChat: boolean;
  onNewChat: () => void;
  onOptionsPress: () => void;
}) {
  return (
    <View style={{ position: "absolute", top: 8, left: 12, right: 12, zIndex: 10 }} className="flex-row items-center justify-between">
      <BlurIconButton onPress={onMenuPress}>
        <Menu size={20} color={Colors.foreground} />
      </BlurIconButton>

      {hasStartedChat && (
        <View className="flex-row gap-2">
          <BlurIconButton onPress={onNewChat}>
            <SquarePen size={18} color={Colors.foreground} />
          </BlurIconButton>
          <BlurIconButton onPress={onOptionsPress}>
            <MoreVertical size={18} color={Colors.foreground} />
          </BlurIconButton>
        </View>
      )}
    </View>
  );
}

/**
 * ne-pisirsem'deki app/chat/page.tsx'in mobil karşılığı. Sohbet geçmişi
 * çekmecesi (bkz. ChatSidebarDrawer) ChatGPT'deki gibi ana içeriği sağa
 * "itiyor". Başlık ve alt yazma barı da ChatGPT'ninkine benzetildi: ayrı bir
 * çubuk/kenarlık yok, sadece yüzen ikon butonları ve tek bir yuvarlak
 * yazma kutusu + gönder butonu. Premium API anahtarı girme ekranı (Profil)
 * henüz yok, o yüzden şu an her zaman ücretsiz mod.
 */
export default function ChatScreen() {
  // Anasayfadaki IngredientPicker /chat'e { ingredients } param'ıyla
  // yönlendiriyor (bkz. components/IngredientPicker.tsx) — web'deki
  // /chat?ingredients=... ile aynı akış.
  const params = useLocalSearchParams<{ ingredients?: string; historyEntryId?: string }>();
  const dispatch = useAppDispatch();
  const equipmentState = useAppSelector((state) => state.equipment);
  const personCount = useAppSelector((state) => state.personCount.value);
  const recipeMode = useAppSelector((state) => state.recipeMode.value);
  const userProfile = useAppSelector((state) => state.userProfile);
  const usageCount = useAppSelector((state) => state.usageCounter.count);
  const history = useAppSelector((state) => state.history);
  const apiKey = useAppSelector((state) => state.apiKey);
  // Profilde premium bir API anahtarı kaydedilmişse ücretsiz mod limiti
  // uygulanmaz — bkz. callApi'de premiumProvider/premiumApiKey'in isteğe eklenmesi.
  const isFreeMode = !apiKey.key;
  const limitReached = isFreeMode && usageCount >= FREE_USAGE_LIMIT;

  const [photo, setPhoto] = useState<string | null>(null);
  const [ingredientsText, setIngredientsText] = useState(() => params.ingredients ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpPhoto, setFollowUpPhoto] = useState<string | null>(null);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesScrollRef = useRef<ScrollView>(null);
  // Kullanıcı mesaj balonuna uzun basınca açılan Kopyala/Paylaş menüsü
  // (bkz. MessageActionMenu) — anchor, dokunulan ekran noktası.
  const [longPressMenu, setLongPressMenu] = useState<{
    visible: boolean;
    anchor: { x: number; y: number } | null;
    text: string;
    createdAt: number;
  }>({
    visible: false,
    anchor: null,
    text: "",
    createdAt: Date.now(),
  });
  // Şu an ekranda görünen sohbetin historySlice'taki kaydı — yeni bir tarif
  // üretildiğinde (handleSubmit) ya da çekmeceden bir kayıt seçildiğinde
  // (handleSelectEntry) buraya yazılır; "..." menüsündeki Pinle/Sil bu id'yi
  // kullanır. Henüz kaydedilmemiş (ör. hâlâ ilk istek gönderiliyor) bir
  // sohbette null'dur.
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  const pushX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pushX, {
      toValue: isSidebarOpen ? DRAWER_WIDTH : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isSidebarOpen, pushX]);

  // Favoriler'deki "Sohbet Favorileri" satırına dokunulunca (bkz.
  // favorites.tsx) buraya { historyEntryId } param'ıyla yönlendiriliyor —
  // o sohbeti en baştan handleSelectEntry ile aynen ChatSidebarDrawer'dan
  // seçilmiş gibi yükler.
  useEffect(() => {
    if (!params.historyEntryId) return;
    const entry = history.find((item) => item.id === params.historyEntryId);
    if (entry) handleSelectEntry(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.historyEntryId]);

  const hasIngredientsText = ingredientsText.trim().length > 0;
  const hasStartedChat = messages.length > 0;
  const canSubmit = Boolean(photo) || hasIngredientsText;
  const currentEntry = currentEntryId ? history.find((entry) => entry.id === currentEntryId) : undefined;

  async function pickPhotoFrom(source: "camera" | "library", target: "new" | "followUp") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], base64: true, quality: 0.7 };
    const result =
      source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) return;
    const dataUrl = `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;
    if (target === "new") setPhoto(dataUrl);
    else setFollowUpPhoto(dataUrl);
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
      ...(apiKey.key ? { premiumProvider: apiKey.provider, premiumApiKey: apiKey.key } : {}),
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

      const newEntryId = makeMessageId();
      setCurrentEntryId(newEntryId);
      dispatch(
        addHistoryEntry({
          id: newEntryId,
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
    if ((!trimmed && !followUpPhoto) || isSendingFollowUp || limitReached) return;

    const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
    const previousTitles = lastAssistantMessage?.recipes?.map((r) => r.title).join(", ");
    const combinedText = previousTitles
      ? `Önceki tarif(ler): ${previousTitles}. Ek istek: ${trimmed || "(fotoğrafa bak)"}`
      : trimmed;

    setIsSendingFollowUp(true);
    setFollowUpError(null);
    setMessages((prev) => [
      ...prev,
      { id: makeMessageId(), role: "user", text: trimmed || "Fotoğrafımdaki malzemelerle ne yapabilirim?", createdAt: Date.now() },
    ]);
    setFollowUpText("");
    setFollowUpPhoto(null);

    try {
      const recipes = await callApi(combinedText, followUpPhoto ?? undefined);
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
    setFollowUpPhoto(null);
    setFollowUpError(null);
    setCurrentEntryId(null);
    setIsFindOpen(false);
    setFindQuery("");
  }

  // ne-pisirsem'deki app/chat/page.tsx handleSelectEntry ile aynı mantık —
  // ChatSidebarDrawer'dan bir geçmiş sohbet seçilince o sohbetin bağlamına
  // (kişi sayısı/ekipman/mod) geçilir ve mesaj dizisi yeniden kurulur.
  function handleSelectEntry(entry: HistoryEntry) {
    dispatch(setPersonCount(entry.personCount));
    dispatch(setEquipment(buildEquipmentState(entry.equipment)));
    dispatch(setRecipeMode(entry.mode));
    setCurrentEntryId(entry.id);

    if (entry.messages && entry.messages.length > 0) {
      setMessages(entry.messages);
      setStatus("idle");
      setFollowUpError(null);
      return;
    }

    const equipmentLabels = entry.equipment.map((key) => EQUIPMENT_LABELS[key]).join(", ");
    setMessages([
      {
        id: makeMessageId(),
        role: "user",
        text: entry.ingredientsText || (entry.hadPhoto ? "Fotoğrafımdaki malzemelerle ne yapabilirim?" : ""),
        createdAt: entry.createdAt,
      },
      {
        id: makeMessageId(),
        role: "assistant",
        text:
          entry.recipeTitles.length > 0
            ? `${entry.recipeTitles.join(", ")} (${equipmentLabels} · ${entry.personCount} kişilik)`
            : "Bu sohbet için kayıtlı tarif bulunamadı.",
        createdAt: entry.createdAt,
      },
    ]);
    setStatus("idle");
    setFollowUpError(null);
  }

  function handleTogglePin() {
    if (!currentEntryId) {
      Alert.alert("Henüz kaydedilmedi", "Bu sohbet daha kaydedilmediği için sabitlenemiyor.");
      return;
    }
    dispatch(toggleHistoryFavorite(currentEntryId));
  }

  async function handleShare() {
    const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
    const titles = lastAssistantMessage?.recipes?.map((r) => r.title).join(", ");
    try {
      await Share.share({ message: titles ? `CookSnap'te bulduğum tarif: ${titles}` : "CookSnap'ten bir sohbet paylaşıyorum." });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  // ChatGPT'nin "branch in new chat" özelliğinin karşılığı — o mesaja kadarki
  // konuşmayı ayrı, bağımsız bir sohbet kaydı olarak kaydedip oraya geçer
  // (bkz. ChatMessageActions'taki dallanma ikonu).
  function handleBranchFrom(messageId: string) {
    const index = messages.findIndex((message) => message.id === messageId);
    if (index === -1) return;

    const branchMessages = messages.slice(0, index + 1);
    const newEntryId = makeMessageId();
    setMessages(branchMessages);
    setCurrentEntryId(newEntryId);
    dispatch(
      addHistoryEntry({
        id: newEntryId,
        ingredientsText: currentEntry?.ingredientsText,
        hadPhoto: currentEntry?.hadPhoto ?? false,
        personCount,
        equipment: EQUIPMENT_KEYS.filter((key) => equipmentState[key]),
        mode: recipeMode,
        recipeTitles: branchMessages.flatMap((message) => message.recipes?.map((recipe) => recipe.title) ?? []),
        messages: branchMessages,
      }),
    );
    notify("Sohbet yeni bir dal olarak kaydedildi");
  }

  function handleDeleteCurrentChat() {
    Alert.alert("Sohbeti sil", "Bu sohbeti silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          if (currentEntryId) dispatch(deleteHistoryEntry(currentEntryId));
          handleNewChat();
        },
      },
    ]);
  }

  const visibleMessages =
    isFindOpen && findQuery.trim()
      ? messages.filter((message) => {
          const term = findQuery.trim().toLowerCase();
          return (
            message.text?.toLowerCase().includes(term) ||
            message.recipes?.some((recipe) => recipe.title.toLowerCase().includes(term))
          );
        })
      : messages;

  const screenContent = hasStartedChat ? (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1 }}>
          <ChatFloatingHeader
            onMenuPress={() => setIsSidebarOpen(true)}
            hasStartedChat
            onNewChat={handleNewChat}
            onOptionsPress={() => setIsOptionsOpen(true)}
          />

          {isFindOpen && (
            <View
              style={{ position: "absolute", top: 56, left: 12, right: 12, zIndex: 9 }}
              className="flex-row items-center gap-2 rounded-full border border-surface-border bg-surface-card px-4 py-2"
            >
              <Search size={14} color={Colors.surfaceTextMuted} />
              <TextInput
                autoFocus
                value={findQuery}
                onChangeText={setFindQuery}
                placeholder="Bu sohbette ara"
                placeholderTextColor={Colors.surfaceTextMuted}
                className="flex-1 text-sm text-foreground"
              />
              <Pressable
                onPress={() => {
                  setIsFindOpen(false);
                  setFindQuery("");
                }}
                hitSlop={8}
              >
                <X size={16} color={Colors.surfaceTextMuted} />
              </Pressable>
            </View>
          )}

          <ScrollView
            ref={messagesScrollRef}
            className="flex-1"
            contentContainerClassName="gap-3 p-4"
            style={{ paddingTop: 64 }}
            scrollEventThrottle={100}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              setShowScrollToBottom(distanceFromBottom > 200);
            }}
          >
            {visibleMessages.map((message) =>
              message.role === "user" ? (
                <Pressable
                  key={message.id}
                  onLongPress={(event) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setLongPressMenu({
                      visible: true,
                      anchor: { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY },
                      text: message.text ?? "",
                      createdAt: message.createdAt,
                    });
                  }}
                  className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-brand-orange px-4 py-2.5"
                >
                  <Text className="text-sm text-white">{message.text}</Text>
                </Pressable>
              ) : (
                <View key={message.id} className="gap-3">
                  {message.text && (
                    <View className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-surface-border bg-surface-card px-4 py-2.5">
                      <Text className="text-sm text-foreground">{message.text}</Text>
                    </View>
                  )}
                  {message.recipes?.map((recipe, index) => (
                    <RecipeMessageCard key={index} recipe={recipe} onStartTimer={() => setIsSidebarOpen(true)} />
                  ))}
                  {(message.text || (message.recipes && message.recipes.length > 0)) && (
                    <ChatMessageActions
                      recipes={message.recipes}
                      text={message.text}
                      createdAt={message.createdAt}
                      onBranch={() => handleBranchFrom(message.id)}
                      isChatFavorite={Boolean(currentEntry?.isFavorite)}
                      onToggleChatFavorite={handleTogglePin}
                    />
                  )}
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

          {showScrollToBottom && (
            <View style={{ position: "absolute", bottom: 12, right: 16 }}>
              <BlurIconButton
                size={36}
                onPress={() => {
                  messagesScrollRef.current?.scrollToEnd({ animated: true });
                  setShowScrollToBottom(false);
                }}
              >
                <ChevronDown size={18} color={Colors.foreground} />
              </BlurIconButton>
            </View>
          )}
        </View>

        <View className="gap-2 p-3">
          {followUpPhoto && (
            <View className="flex-row items-center gap-2 self-start rounded-xl border border-surface-border bg-surface-card p-2">
              <Image source={{ uri: followUpPhoto }} className="h-10 w-10 rounded-lg" />
              <Pressable onPress={() => setFollowUpPhoto(null)} hitSlop={8}>
                <X size={16} color={Colors.stateError} />
              </Pressable>
            </View>
          )}
          <View style={{ alignItems: "flex-end" }} className="flex-row gap-2">
            <Pressable
              onPress={() => setIsAttachOpen(true)}
              style={{ height: 40, width: 40 }}
              className="items-center justify-center rounded-full border border-surface-border bg-surface-card"
            >
              <Plus size={18} color={Colors.foreground} />
            </Pressable>
            <TextInput
              value={followUpText}
              onChangeText={setFollowUpText}
              placeholder="Ek bir şey sor ya da malzeme ekle…"
              className="flex-1 rounded-full border border-surface-border bg-surface-card px-4 py-2.5 text-foreground"
              placeholderTextColor={Colors.surfaceTextMuted}
              editable={!isSendingFollowUp && !limitReached}
            />
            <Pressable
              onPress={() => Alert.alert("Sesli yazma", "Bu özellik yakında geliyor.")}
              style={{ height: 40, width: 40 }}
              className="items-center justify-center rounded-full border border-surface-border bg-surface-card"
            >
              <Mic size={18} color={Colors.foreground} />
            </Pressable>
            <Pressable
              onPress={handleFollowUpSend}
              disabled={isSendingFollowUp || limitReached || (!followUpText.trim() && !followUpPhoto)}
              className="h-10 w-10 items-center justify-center rounded-full bg-brand-orange disabled:opacity-50"
            >
              <Send size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ChatOptionsMenu
        visible={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        isPinned={Boolean(currentEntry?.isFavorite)}
        onTogglePin={handleTogglePin}
        onFindInChat={() => setIsFindOpen(true)}
        onShare={handleShare}
        onUploadPhoto={() => pickPhotoFrom("library", "followUp")}
        onDelete={handleDeleteCurrentChat}
      />
      <AttachMenu
        visible={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        onPickCamera={() => pickPhotoFrom("camera", "followUp")}
        onPickLibrary={() => pickPhotoFrom("library", "followUp")}
      />
      <MessageActionMenu
        visible={longPressMenu.visible}
        anchor={longPressMenu.anchor}
        text={longPressMenu.text}
        createdAt={longPressMenu.createdAt}
        onClose={() => setLongPressMenu((state) => ({ ...state, visible: false }))}
      />
    </SafeAreaView>
  ) : (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1 }}>
          <ChatFloatingHeader
            onMenuPress={() => setIsSidebarOpen(true)}
            hasStartedChat={false}
            onNewChat={handleNewChat}
            onOptionsPress={() => setIsOptionsOpen(true)}
          />

          <ScrollView contentContainerClassName="gap-6 p-4 pb-10" style={{ paddingTop: 56 }}>
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
                onPress={() => pickPhotoFrom("library", "new")}
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
            ) : isFreeMode ? (
              <Text className="text-center text-xs text-surface-text-muted">
                Ücretsiz modda kullanılan istek: {usageCount}/{FREE_USAGE_LIMIT}
              </Text>
            ) : (
              <Text className="text-center text-xs text-surface-text-muted">
                Premium mod aktif ({apiKey.provider}).
              </Text>
            )}

            {error && <Text className="text-center text-sm text-state-error">{error}</Text>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surfaceWarm }}>
      <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH }}>
        <ChatSidebarDrawer
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSelectEntry={handleSelectEntry}
          disabled={isSendingFollowUp}
          selectedEntryId={hasStartedChat ? currentEntryId : null}
        />
      </View>

      <Animated.View style={{ flex: 1, transform: [{ translateX: pushX }] }}>
        {screenContent}
        {isSidebarOpen && (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: pushX.interpolate({ inputRange: [0, DRAWER_WIDTH], outputRange: [0, 1] }),
            }}
          >
            <Pressable onPress={() => setIsSidebarOpen(false)} style={{ flex: 1 }}>
              <BlurView intensity={30} tint="dark" style={{ flex: 1 }} />
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
