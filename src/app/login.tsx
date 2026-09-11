import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Mail, User } from "lucide-react-native";
import { useAppDispatch } from "@/lib/redux/hooks";
import { getFirebaseAuth, signInWithEmail, signUpWithEmail } from "@/lib/firebase/auth";
import { setGuestMode } from "@/lib/redux/guestModeSlice";
import { setName } from "@/lib/redux/userProfileSlice";
import { Colors } from "@/constants/theme";

type Mode = "signIn" | "signUp";

/**
 * ne-pisirsem'deki app/login/page.tsx'in mobil karşılığı — masaüstündeki
 * kayan sol/sağ panel animasyonu mobilde anlamsız olduğu için tek sütun,
 * üstte sekme gibi iki buton (Giriş yap / Hesap oluştur) ile değiştiriliyor.
 * Google ile giriş native'de expo-auth-session + ayrı OAuth client kurulumu
 * gerektiriyor (bkz. lib/firebase/auth.ts) — o yüzden burada henüz yok.
 */
export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const firebaseConfigured = getFirebaseAuth() !== null;

  async function handleSubmit() {
    setErrorMessage(null);
    setSubmitting(true);

    const result = mode === "signIn" ? await signInWithEmail(email, password) : await signUpWithEmail(email, password);

    setSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.errorMessage ?? "Bir şeyler ters gitti, tekrar dene.");
      return;
    }

    if (mode === "signUp" && signUpName.trim()) {
      dispatch(setName(signUpName.trim()));
    }
    dispatch(setGuestMode(false));
  }

  function handleSkip() {
    dispatch(setGuestMode(true));
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-warm">
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-sm gap-5 rounded-2xl bg-surface-card p-6 shadow-sm">
          <View className="flex-row gap-2 rounded-full bg-surface-warm p-1">
            <Pressable
              onPress={() => setMode("signIn")}
              className={`flex-1 items-center rounded-full py-2 ${mode === "signIn" ? "bg-brand-orange" : ""}`}
            >
              <Text className={mode === "signIn" ? "font-bold text-white" : "font-semibold text-surface-text-muted"}>Giriş yap</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("signUp")}
              className={`flex-1 items-center rounded-full py-2 ${mode === "signUp" ? "bg-brand-orange" : ""}`}
            >
              <Text className={mode === "signUp" ? "font-bold text-white" : "font-semibold text-surface-text-muted"}>Hesap oluştur</Text>
            </Pressable>
          </View>

          <View className="gap-1">
            <Text className="text-center text-2xl font-bold text-brand-red">
              {mode === "signIn" ? "Giriş yap" : "Hesap oluştur"}
            </Text>
            <Text className="text-center text-sm text-surface-text-muted">
              Farklı bir cihazdan giriş yaptığında favorilerin ve geçmişin seninle gelir.
            </Text>
          </View>

          {!firebaseConfigured && (
            <Text className="text-center text-sm text-state-error">Giriş sistemi henüz yapılandırılmadı.</Text>
          )}

          {mode === "signUp" && (
            <View className="flex-row items-center gap-2 rounded-lg border border-surface-border px-3 py-2.5">
              <User size={18} color={Colors.surfaceTextMuted} />
              <TextInput
                value={signUpName}
                onChangeText={setSignUpName}
                placeholder="Ad soyad"
                autoComplete="name"
                className="flex-1 text-foreground"
                placeholderTextColor={Colors.surfaceTextMuted}
              />
            </View>
          )}

          <View className="flex-row items-center gap-2 rounded-lg border border-surface-border px-3 py-2.5">
            <Mail size={18} color={Colors.surfaceTextMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta"
              autoComplete="email"
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 text-foreground"
              placeholderTextColor={Colors.surfaceTextMuted}
            />
          </View>

          <View className="flex-row items-center gap-2 rounded-lg border border-surface-border px-3 py-2.5">
            <Lock size={18} color={Colors.surfaceTextMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={mode === "signIn" ? "Şifre" : "En az 6 karakter"}
              secureTextEntry
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              className="flex-1 text-foreground"
              placeholderTextColor={Colors.surfaceTextMuted}
            />
          </View>

          {errorMessage && <Text className="text-center text-sm text-state-error">{errorMessage}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !firebaseConfigured}
            className="items-center rounded-full bg-brand-orange py-3 disabled:opacity-60"
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-bold text-white">{mode === "signIn" ? "Giriş yap" : "Hesap oluştur"}</Text>
            )}
          </Pressable>

          <Text className="text-center text-xs text-surface-text-muted">Google ile giriş yakında geliyor.</Text>

          <Pressable onPress={handleSkip} className="items-center py-1">
            <Text className="text-sm font-semibold text-surface-text-muted">Şimdilik atla</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
