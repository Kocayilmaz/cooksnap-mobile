import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  ChevronDown,
  Globe,
  HelpCircle,
  KeyRound,
  LogOut,
  Mail,
  ShieldQuestion,
  Share2,
  SquarePen,
} from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setCountry, setName, setPhotoUri, setLanguage, type RecipeLanguage } from "@/lib/redux/userProfileSlice";
import { setProvider, setKey, clearApiKey, PREMIUM_PROVIDER_KEYS, type PremiumProvider } from "@/lib/redux/apiKeySlice";
import { setUnauthenticated } from "@/lib/redux/authSlice";
import { setGuestMode } from "@/lib/redux/guestModeSlice";
import { changeEmail, changePassword, signOutUser } from "@/lib/firebase/auth";
import { getInitials } from "@/lib/initials";
import { notify } from "@/lib/notify";
import { Colors } from "@/constants/theme";

const LANGUAGE_LABELS: Record<RecipeLanguage, string> = { tr: "Türkçe", en: "English" };
const PROVIDER_LABELS: Record<PremiumProvider, string> = {
  claude: "Claude",
  openai: "OpenAI",
  gemini: "Gemini",
  groq: "Groq",
};

/** Ayarlar listesindeki her satır — sağda ok yerine bazılarında açılır
 * içerik (accordion) olabiliyor, o durumda ok yukarı/aşağı döner. */
function SettingsRow({
  icon,
  label,
  onPress,
  expanded,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  expanded?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-3.5">
      {icon}
      <Text className={`flex-1 text-sm font-medium ${destructive ? "text-state-error" : "text-foreground"}`}>{label}</Text>
      {expanded !== undefined && (
        <ChevronDown
          size={16}
          color={Colors.surfaceTextMuted}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      )}
    </Pressable>
  );
}

/**
 * Profil sekmesi — ne-pisirsem'deki (web) profil/ayarlar panelinin mobil
 * karşılığı. Fotoğraf (yoksa isim baş harfleriyle bir avatar), isim, ülke,
 * "Profili Düzenle"/"Profili Paylaş" butonları ve altında bir Ayarlar
 * listesi: dil, yapay zeka anahtarı (premium mod), e-posta/şifre değişimi,
 * çıkış ve yardım. Alttaki 4. sekme (bkz. (tabs)/_layout.tsx).
 */
export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { name, country, photoUri, language } = useAppSelector((state) => state.userProfile);
  const email = useAppSelector((state) => state.auth.email);
  const isGuest = useAppSelector((state) => state.guestMode.isGuest);
  const apiKey = useAppSelector((state) => state.apiKey);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftCountry, setDraftCountry] = useState(country);

  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [draftProvider, setDraftProvider] = useState<PremiumProvider>(apiKey.provider);
  const [draftKey, setDraftKey] = useState(apiKey.key);

  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [isEmailSaving, setIsEmailSaving] = useState(false);

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [draftPassword, setDraftPassword] = useState("");
  const [draftPasswordConfirm, setDraftPasswordConfirm] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.7 });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) return;
    dispatch(setPhotoUri(`data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`));
  }

  function handleSaveProfile() {
    dispatch(setName(draftName.trim()));
    dispatch(setCountry(draftCountry.trim()));
    setIsEditing(false);
    notify("Profil güncellendi");
  }

  async function handleShareProfile() {
    try {
      await Share.share({
        message: name ? `${name} CookSnap'te tarifler keşfediyor!` : "CookSnap'te tarifler keşfediyorum!",
      });
    } catch {
      // kullanıcı paylaşım sayfasını kapattıysa best-effort, hata göstermeye gerek yok.
    }
  }

  function handleSaveApiKey() {
    dispatch(setProvider(draftProvider));
    dispatch(setKey(draftKey.trim()));
    notify("Yapay zeka anahtarı kaydedildi");
    setIsApiKeyOpen(false);
  }

  function handleClearApiKey() {
    dispatch(clearApiKey());
    setDraftKey("");
    notify("Yapay zeka anahtarı temizlendi");
  }

  async function handleSaveEmail() {
    const trimmed = draftEmail.trim();
    if (!trimmed) return;
    setIsEmailSaving(true);
    const result = await changeEmail(trimmed);
    setIsEmailSaving(false);
    if (result.ok) {
      notify("E-posta güncellendi");
      setIsEmailOpen(false);
      setDraftEmail("");
    } else {
      Alert.alert("E-posta değiştirilemedi", result.errorMessage);
    }
  }

  async function handleSavePassword() {
    if (draftPassword.length < 6) {
      Alert.alert("Şifre çok kısa", "Şifre en az 6 karakter olmalı.");
      return;
    }
    if (draftPassword !== draftPasswordConfirm) {
      Alert.alert("Şifreler eşleşmiyor", "Girdiğin iki şifre birbiriyle aynı olmalı.");
      return;
    }
    setIsPasswordSaving(true);
    const result = await changePassword(draftPassword);
    setIsPasswordSaving(false);
    if (result.ok) {
      notify("Şifre güncellendi");
      setIsPasswordOpen(false);
      setDraftPassword("");
      setDraftPasswordConfirm("");
    } else {
      Alert.alert("Şifre değiştirilemedi", result.errorMessage);
    }
  }

  function handleLogout() {
    Alert.alert("Çıkış yap", "Hesabından çıkış yapmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          await signOutUser();
          dispatch(setUnauthenticated());
          dispatch(setGuestMode(false));
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-warm">
      <View className="px-4 pt-4 pb-1">
        <Text className="text-base font-bold text-foreground">Profil</Text>
      </View>

      <ScrollView contentContainerClassName="gap-6 p-4 pb-10">
        <View className="flex-row items-center gap-4">
          <Pressable onPress={pickPhoto} style={{ height: 76, width: 76, borderRadius: 38, overflow: "hidden" }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, backgroundColor: Colors.brandOrange }} className="items-center justify-center">
                <Text className="text-2xl font-bold text-white">{getInitials(name, email)}</Text>
              </View>
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                height: 24,
                width: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: Colors.surfaceWarm,
                backgroundColor: Colors.foreground,
              }}
              className="items-center justify-center"
            >
              <Camera size={12} color="#ffffff" />
            </View>
          </Pressable>

          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="text-lg font-bold text-foreground">
              {name || "İsimsiz Kullanıcı"}
            </Text>
            <Text numberOfLines={1} className="text-sm text-surface-text-muted">
              {country || "Ülke seçilmedi"}
            </Text>
          </View>
        </View>

        {isEditing && (
          <View className="gap-3 rounded-2xl bg-surface-card p-4 shadow-sm">
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-surface-text-muted">İsim</Text>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder="İsmini yaz"
                placeholderTextColor={Colors.surfaceTextMuted}
                className="rounded-xl border border-surface-border px-3 py-2.5 text-sm text-foreground"
              />
            </View>
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-surface-text-muted">Ülke</Text>
              <TextInput
                value={draftCountry}
                onChangeText={setDraftCountry}
                placeholder="Örn. Türkiye"
                placeholderTextColor={Colors.surfaceTextMuted}
                className="rounded-xl border border-surface-border px-3 py-2.5 text-sm text-foreground"
              />
            </View>
            <Pressable onPress={handleSaveProfile} className="items-center rounded-full bg-brand-orange py-3">
              <Text className="text-sm font-semibold text-white">Kaydet</Text>
            </Pressable>
          </View>
        )}

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => {
              setDraftName(name);
              setDraftCountry(country);
              setIsEditing((prev) => !prev);
            }}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-surface-border py-3"
          >
            <SquarePen size={15} color={Colors.foreground} />
            <Text className="text-sm font-semibold text-foreground">Profili Düzenle</Text>
          </Pressable>
          <Pressable
            onPress={handleShareProfile}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-surface-border py-3"
          >
            <Share2 size={15} color={Colors.foreground} />
            <Text className="text-sm font-semibold text-foreground">Profili Paylaş</Text>
          </Pressable>
        </View>

        <View className="gap-1">
          <Text className="px-1 text-sm font-semibold text-brand-orange">Ayarlar</Text>
          <View className="rounded-2xl bg-surface-card px-4 shadow-sm">
            <SettingsRow
              icon={<Globe size={18} color={Colors.foreground} />}
              label={`Dil (${LANGUAGE_LABELS[language]})`}
              onPress={() => setIsLanguageOpen(true)}
            />
            <View style={{ height: 1, backgroundColor: Colors.surfaceBorder }} />

            <SettingsRow
              icon={<KeyRound size={18} color={Colors.foreground} />}
              label="Premium Mod (Yapay Zeka Anahtarı)"
              expanded={isApiKeyOpen}
              onPress={() => setIsApiKeyOpen((prev) => !prev)}
            />
            {isApiKeyOpen && (
              <View className="gap-3 pb-4">
                <Text className="text-xs text-surface-text-muted">
                  Kendi Claude, OpenAI, Gemini ya da Groq anahtarını girersen ücretsiz mod limiti kalkar. Anahtar
                  yalnızca bu cihazda saklanır.
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PREMIUM_PROVIDER_KEYS.map((provider) => {
                    const active = draftProvider === provider;
                    return (
                      <Pressable
                        key={provider}
                        onPress={() => setDraftProvider(provider)}
                        style={{ borderWidth: 1, borderColor: active ? Colors.brandOrange : Colors.surfaceBorder }}
                        className={`rounded-full px-3 py-1.5 ${active ? "bg-brand-orange" : "bg-surface-warm"}`}
                      >
                        <Text className={`text-xs font-medium ${active ? "text-white" : "text-surface-text-muted"}`}>
                          {PROVIDER_LABELS[provider]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={draftKey}
                  onChangeText={setDraftKey}
                  placeholder="API anahtarını yapıştır"
                  placeholderTextColor={Colors.surfaceTextMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  className="rounded-xl border border-surface-border px-3 py-2.5 text-sm text-foreground"
                />
                <View className="flex-row gap-3">
                  <Pressable onPress={handleClearApiKey} className="flex-1 items-center rounded-full border border-surface-border py-2.5">
                    <Text className="text-sm font-semibold text-foreground">Temizle</Text>
                  </Pressable>
                  <Pressable onPress={handleSaveApiKey} className="flex-1 items-center rounded-full bg-brand-orange py-2.5">
                    <Text className="text-sm font-semibold text-white">Kaydet</Text>
                  </Pressable>
                </View>
              </View>
            )}
            <View style={{ height: 1, backgroundColor: Colors.surfaceBorder }} />

            {!isGuest && (
              <>
                <SettingsRow
                  icon={<Mail size={18} color={Colors.foreground} />}
                  label="E-posta Değiştir"
                  expanded={isEmailOpen}
                  onPress={() => setIsEmailOpen((prev) => !prev)}
                />
                {isEmailOpen && (
                  <View className="gap-3 pb-4">
                    {email && <Text className="text-xs text-surface-text-muted">Şu anki e-posta: {email}</Text>}
                    <TextInput
                      value={draftEmail}
                      onChangeText={setDraftEmail}
                      placeholder="Yeni e-posta adresi"
                      placeholderTextColor={Colors.surfaceTextMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      className="rounded-xl border border-surface-border px-3 py-2.5 text-sm text-foreground"
                    />
                    <Pressable
                      onPress={handleSaveEmail}
                      disabled={isEmailSaving}
                      style={{ opacity: isEmailSaving ? 0.6 : 1 }}
                      className="flex-row items-center justify-center gap-2 rounded-full bg-brand-orange py-2.5"
                    >
                      {isEmailSaving && <ActivityIndicator size="small" color="#ffffff" />}
                      <Text className="text-sm font-semibold text-white">Kaydet</Text>
                    </Pressable>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: Colors.surfaceBorder }} />

                <SettingsRow
                  icon={<ShieldQuestion size={18} color={Colors.foreground} />}
                  label="Şifre Değiştir"
                  expanded={isPasswordOpen}
                  onPress={() => setIsPasswordOpen((prev) => !prev)}
                />
                {isPasswordOpen && (
                  <View className="gap-3 pb-4">
                    <TextInput
                      value={draftPassword}
                      onChangeText={setDraftPassword}
                      placeholder="Yeni şifre"
                      placeholderTextColor={Colors.surfaceTextMuted}
                      secureTextEntry
                      className="rounded-xl border border-surface-border px-3 py-2.5 text-sm text-foreground"
                    />
                    <TextInput
                      value={draftPasswordConfirm}
                      onChangeText={setDraftPasswordConfirm}
                      placeholder="Yeni şifre (tekrar)"
                      placeholderTextColor={Colors.surfaceTextMuted}
                      secureTextEntry
                      className="rounded-xl border border-surface-border px-3 py-2.5 text-sm text-foreground"
                    />
                    <Pressable
                      onPress={handleSavePassword}
                      disabled={isPasswordSaving}
                      style={{ opacity: isPasswordSaving ? 0.6 : 1 }}
                      className="flex-row items-center justify-center gap-2 rounded-full bg-brand-orange py-2.5"
                    >
                      {isPasswordSaving && <ActivityIndicator size="small" color="#ffffff" />}
                      <Text className="text-sm font-semibold text-white">Kaydet</Text>
                    </Pressable>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: Colors.surfaceBorder }} />
              </>
            )}

            <SettingsRow icon={<LogOut size={18} color={Colors.stateError} />} label="Çıkış Yap" destructive onPress={handleLogout} />
            <View style={{ height: 1, backgroundColor: Colors.surfaceBorder }} />

            <SettingsRow
              icon={<HelpCircle size={18} color={Colors.foreground} />}
              label="Yardım"
              expanded={isHelpOpen}
              onPress={() => setIsHelpOpen((prev) => !prev)}
            />
            {isHelpOpen && (
              <View className="gap-3 pb-4">
                <View className="gap-1">
                  <Text className="text-sm font-semibold text-foreground">Fotoğraf çekmek zorunda mıyım?</Text>
                  <Text className="text-xs text-surface-text-muted">
                    Hayır. Ana sayfada fotoğraf yerine elindeki malzemeleri yazabilirsin, ya da ikisini birlikte
                    kullanabilirsin.
                  </Text>
                </View>
                <View className="gap-1">
                  <Text className="text-sm font-semibold text-foreground">Verilerim nerede saklanıyor?</Text>
                  <Text className="text-xs text-surface-text-muted">
                    Profil bilgilerin (ad, dil, ülke) ve girdiğin yapay zeka anahtarı bu cihazda saklanır — sunucuya
                    kalıcı olarak gönderilmez.
                  </Text>
                </View>
                <View className="gap-1">
                  <Text className="text-sm font-semibold text-foreground">Premium mod ne işe yarar?</Text>
                  <Text className="text-xs text-surface-text-muted">
                    Kendi Claude, OpenAI, Gemini ya da Groq anahtarını girersen ücretsiz moddaki kullanım limiti
                    kalkar.
                  </Text>
                </View>
                <View className="gap-1">
                  <Text className="text-sm font-semibold text-foreground">API anahtarımı nereden alabilirim?</Text>
                  <Text className="text-xs text-surface-text-muted">
                    Dört sağlayıcıdan (Groq, Gemini, Claude, OpenAI) birini seçip "Premium Mod" kutusuna anahtarını
                    girebilirsin. Groq ve Gemini ücretsiz katmanla başlar.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <LanguagePickerSheet
        visible={isLanguageOpen}
        selected={language}
        onClose={() => setIsLanguageOpen(false)}
        onSelect={(next) => {
          dispatch(setLanguage(next));
          setIsLanguageOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

/** Dil seçimi — alttan açılan panel, diğer panellerde olduğu gibi backdrop'un
 * kardeşi olarak absolute konumlanıyor (borderRadius'un Android'de doğru
 * klipslenmesi için, bkz. AddToCollectionSheet'teki not). */
function LanguagePickerSheet({
  visible,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: RecipeLanguage;
  onClose: () => void;
  onSelect: (language: RecipeLanguage) => void;
}) {
  if (!visible) return null;

  return (
    <>
      <Pressable
        onPress={onClose}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: "rgba(23,23,23,0.4)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1001,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          backgroundColor: Colors.surfaceWarm,
          gap: 4,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
      >
        <Text className="px-1 pb-2 text-sm font-semibold text-surface-text-muted">Dil Seç</Text>
        {(Object.keys(LANGUAGE_LABELS) as RecipeLanguage[]).map((option) => (
          <Pressable key={option} onPress={() => onSelect(option)} className="flex-row items-center justify-between py-3">
            <Text className="text-sm font-medium text-foreground">{LANGUAGE_LABELS[option]}</Text>
            {selected === option && (
              <View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: Colors.brandOrange }} />
            )}
          </Pressable>
        ))}
      </View>
    </>
  );
}
