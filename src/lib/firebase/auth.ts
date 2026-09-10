import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type Unsubscribe,
  type User,
} from "firebase/auth";
// @ts-expect-error — firebase/auth/react-native tip tanımları eksik ama runtime'da var (bkz. firebase-js-sdk #9316).
import { initializeAuth, getReactNativePersistence } from "firebase/auth/react-native";
import { getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig, isFirebaseConfigured } from "./config";

/**
 * Native (iOS/Android) tarafı — oturum AsyncStorage'da kalıcı tutulur, aksi
 * halde uygulama her yeniden açılışta kullanıcıyı çıkışa düşürür. Web
 * derlemesinde bu dosya yerine auth.web.ts (Metro'nun .web.ts önceliğiyle)
 * kullanılır — orada firebase/auth/react-native'e gerek yok/çalışmıyor.
 */

let cachedAuth: Auth | null | undefined;

export function getFirebaseAuth(): Auth | null {
  if (cachedAuth !== undefined) return cachedAuth;

  if (!isFirebaseConfigured()) {
    cachedAuth = null;
    return cachedAuth;
  }

  try {
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    cachedAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    }) as Auth;
  } catch {
    cachedAuth = null;
  }

  return cachedAuth;
}

export interface AuthResult {
  ok: boolean;
  errorMessage?: string;
}

function toTurkishErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Bu e-posta adresiyle zaten bir hesap var.";
    case "auth/invalid-email":
      return "E-posta adresi geçersiz.";
    case "auth/weak-password":
      return "Şifre en az 6 karakter olmalı.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-posta veya şifre hatalı.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı, biraz sonra tekrar dene.";
    default:
      console.error("Firebase auth hatasi:", error);
      return "Bir şeyler ters gitti, tekrar dene.";
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) return { ok: false, errorMessage: "Giriş sistemi şu an kullanılamıyor." };

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    return { ok: true };
  } catch (error) {
    return { ok: false, errorMessage: toTurkishErrorMessage(error) };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) return { ok: false, errorMessage: "Giriş sistemi şu an kullanılamıyor." };

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { ok: true };
  } catch (error) {
    return { ok: false, errorMessage: toTurkishErrorMessage(error) };
  }
}

/**
 * Google ile giriş henüz yok — native'de popup değil expo-auth-session +
 * ayrı bir Google OAuth client id kurulumu gerekiyor. Yarım/hatalı bir akış
 * sunmamak için şimdilik açıkça "yakında" hatası dönüyor (bkz. proje TODO).
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  return { ok: false, errorMessage: "Google ile giriş mobilde henüz eklenmedi." };
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;

  try {
    await signOut(auth);
  } catch {
    // best-effort — kullanıcı arayüzde zaten çıkmış gibi davranabilir.
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}
