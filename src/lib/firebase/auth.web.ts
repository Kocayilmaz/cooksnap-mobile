import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type Unsubscribe,
  type User,
} from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import { firebaseConfig, isFirebaseConfigured } from "./config";

/**
 * Web (expo start --web / EAS web export) tarafı — plain firebase/auth
 * yeterli, firebase/auth/react-native'e gerek yok (o path RN metro
 * bundle'ında çözülüyor, web derlemesinde çözülemez). Metro bu dosyayı
 * auth.ts yerine otomatik seçer (.web.ts önceliği).
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
    cachedAuth = getAuth(app);
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

export async function signInWithGoogle(): Promise<AuthResult> {
  return { ok: false, errorMessage: "Google ile giriş mobilde henüz eklenmedi." };
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;

  try {
    await signOut(auth);
  } catch {
    // best-effort
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
