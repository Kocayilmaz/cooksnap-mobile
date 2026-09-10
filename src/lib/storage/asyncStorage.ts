import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ne-pisirsem (web) her tercihi kendi localStorage anahtarında, senkron
 * okuyup yazıyordu (bkz. lib/redux/local*Storage.ts). React Native'de
 * localStorage yok, AsyncStorage var ama o da asenkron — bu yüzden her
 * local*Storage.ts karşılığı burada JSON okuma/yazmayı bu ortak yardımcıya
 * devrediyor, kendi anahtarı + tip koruyucusunu (validator) tutuyor.
 */
export async function readJSON<T>(key: string, isValid: (value: unknown) => value is T): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort — depolama dolu/erişilemez olsa da uygulama akışı bozulmasın.
  }
}
