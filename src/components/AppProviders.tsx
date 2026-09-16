import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/redux/store";
import {
  readStoredApiKey,
  writeStoredApiKey,
  readStoredCollections,
  writeStoredCollections,
  readStoredEquipment,
  writeStoredEquipment,
  readStoredFavorites,
  writeStoredFavorites,
  readStoredGuestMode,
  writeStoredGuestMode,
  readStoredHistory,
  writeStoredHistory,
  readStoredMealFavorites,
  writeStoredMealFavorites,
  readStoredMealSearchHistory,
  writeStoredMealSearchHistory,
  readStoredUsage,
  writeStoredUsage,
  readStoredUserProfile,
  writeStoredUserProfile,
} from "@/lib/redux/persistence";
import { setProvider, setKey } from "@/lib/redux/apiKeySlice";
import { setCollections } from "@/lib/redux/collectionsSlice";
import { setEquipment } from "@/lib/redux/equipmentSlice";
import { setFavorites } from "@/lib/redux/favoritesSlice";
import { setGuestMode } from "@/lib/redux/guestModeSlice";
import { setHistory } from "@/lib/redux/historySlice";
import { setMealFavorites } from "@/lib/redux/mealFavoritesSlice";
import { setMealSearchHistory } from "@/lib/redux/mealSearchHistorySlice";
import { setUsage, USAGE_RESET_INTERVAL_MS } from "@/lib/redux/usageCounterSlice";
import { setName, setLanguage, setCountry, setPhotoUri } from "@/lib/redux/userProfileSlice";
import { setAuthenticatedUser, setUnauthenticated } from "@/lib/redux/authSlice";
import { subscribeToAuthState } from "@/lib/firebase/auth";

/**
 * ne-pisirsem'deki StoreProvider.tsx'in mobil karşılığı: store'u bir kere
 * kurar, açılışta AsyncStorage'dan tüm kalıcı tercihleri okuyup dispatch
 * eder, sonra her birinin değişimini dinleyip geri AsyncStorage'a yazar.
 * Web'den farkı: localStorage senkron, AsyncStorage asenkron — bu yüzden
 * ilk okuma tek bir async effect içinde toplanıyor (web'de her tercih için
 * ayrı senkron okuma vardı, burada Promise.all ile paralel).
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const [
        storedApiKey,
        storedCollections,
        storedEquipment,
        storedFavorites,
        storedGuestMode,
        storedHistory,
        storedMealFavorites,
        storedMealSearchHistory,
        storedUsage,
        storedUserProfile,
      ] = await Promise.all([
        readStoredApiKey(),
        readStoredCollections(),
        readStoredEquipment(),
        readStoredFavorites(),
        readStoredGuestMode(),
        readStoredHistory(),
        readStoredMealFavorites(),
        readStoredMealSearchHistory(),
        readStoredUsage(),
        readStoredUserProfile(),
      ]);

      if (!isMounted) return;

      if (storedApiKey) {
        store.dispatch(setProvider(storedApiKey.provider));
        store.dispatch(setKey(storedApiKey.key));
      }
      if (storedCollections) store.dispatch(setCollections(storedCollections));
      if (storedEquipment) store.dispatch(setEquipment(storedEquipment));
      if (storedFavorites) store.dispatch(setFavorites(storedFavorites));
      if (storedGuestMode) store.dispatch(setGuestMode(true));
      if (storedHistory) store.dispatch(setHistory(storedHistory));
      if (storedMealFavorites) store.dispatch(setMealFavorites(storedMealFavorites));
      if (storedMealSearchHistory) store.dispatch(setMealSearchHistory(storedMealSearchHistory));
      if (storedUsage) {
        const expired = Date.now() - storedUsage.lastResetAt >= USAGE_RESET_INTERVAL_MS;
        store.dispatch(setUsage(expired ? { count: 0, lastResetAt: Date.now() } : storedUsage));
      }
      if (storedUserProfile) {
        store.dispatch(setName(storedUserProfile.name));
        store.dispatch(setLanguage(storedUserProfile.language));
        store.dispatch(setCountry(storedUserProfile.country));
        store.dispatch(setPhotoUri(storedUserProfile.photoUri ?? null));
      }
    })();

    const unsubscribeAuth = subscribeToAuthState((user) => {
      if (user) {
        store.dispatch(setAuthenticatedUser({ uid: user.uid, email: user.email, photoURL: user.photoURL }));
      } else {
        store.dispatch(setUnauthenticated());
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, [store]);

  useEffect(() => {
    let previous = store.getState().apiKey;
    return store.subscribe(() => {
      const current = store.getState().apiKey;
      if (current !== previous) {
        void writeStoredApiKey(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().collections;
    return store.subscribe(() => {
      const current = store.getState().collections;
      if (current !== previous) {
        void writeStoredCollections(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().equipment;
    return store.subscribe(() => {
      const current = store.getState().equipment;
      if (current !== previous) {
        void writeStoredEquipment(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().favorites;
    return store.subscribe(() => {
      const current = store.getState().favorites;
      if (current !== previous) {
        void writeStoredFavorites(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().guestMode;
    return store.subscribe(() => {
      const current = store.getState().guestMode;
      if (current !== previous) {
        void writeStoredGuestMode(current.isGuest);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().history;
    return store.subscribe(() => {
      const current = store.getState().history;
      if (current !== previous) {
        void writeStoredHistory(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().mealFavorites;
    return store.subscribe(() => {
      const current = store.getState().mealFavorites;
      if (current !== previous) {
        void writeStoredMealFavorites(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().mealSearchHistory;
    return store.subscribe(() => {
      const current = store.getState().mealSearchHistory;
      if (current !== previous) {
        void writeStoredMealSearchHistory(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().usageCounter;
    return store.subscribe(() => {
      const current = store.getState().usageCounter;
      if (current !== previous) {
        void writeStoredUsage(current);
        previous = current;
      }
    });
  }, [store]);

  useEffect(() => {
    let previous = store.getState().userProfile;
    return store.subscribe(() => {
      const current = store.getState().userProfile;
      if (current !== previous) {
        void writeStoredUserProfile(current);
        previous = current;
      }
    });
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
