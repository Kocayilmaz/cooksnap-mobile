import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let cachedDb: Firestore | null | undefined;

/**
 * Aynı Firebase projesi web (ne-pisirsem) ile paylaşılıyor — bir hesapla
 * web'de kaydedilen favoriler/geçmiş burada da görünür. EXPO_PUBLIC_FIREBASE_*
 * tanımlı değilse null döner, çağıran taraf best-effort olarak yerel
 * (AsyncStorage) moda düşer.
 */
export function getFirestoreDb(): Firestore | null {
  if (cachedDb !== undefined) return cachedDb;

  if (!isFirebaseConfigured()) {
    cachedDb = null;
    return cachedDb;
  }

  try {
    const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
    cachedDb = getFirestore(app);
  } catch {
    cachedDb = null;
  }

  return cachedDb;
}

export { firebaseConfig, isFirebaseConfigured };
