import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { EQUIPMENT_KEYS, EQUIPMENT_LABELS, type Equipment } from "./equipmentSlice";
import { RECIPE_MODE_KEYS, type RecipeMode } from "./recipeModeSlice";
import type { ChatMessage } from "@/lib/types/chat";

export interface HistoryEntry {
  id: string;
  /** Kullanıcının yazdığı malzeme metni, girilmediyse tanımsız. */
  ingredientsText?: string;
  /** Aramada fotoğraf da kullanıldı mı (fotoğrafın kendisi saklanmaz, sadece bu bayrak). */
  hadPhoto: boolean;
  personCount: number;
  equipment: Equipment[];
  mode: RecipeMode;
  /** Dönen tariflerin başlıkları, geçmiş listesinde kısa önizleme için. */
  recipeTitles: string[];
  createdAt: number;
  /** Kullanıcı bu sohbeti favoriledi mi (bkz. ChatSidebar) — favorilenen kayıtlar
   * MAX_HISTORY_ENTRIES kırpmasından muaf tutulur. */
  isFavorite: boolean;
  /** Kullanıcı "Yeniden adlandır" ile elle bir başlık girdiyse burada tutulur;
   * girmediyse sidebar recipeTitles'tan otomatik bir başlık türetir. */
  customTitle?: string;
  /** Sohbetin tam mesaj dizisi — normal kayıtlarda tutulmaz (yalnızca
   * başlıklar saklanır, bkz. recipeTitles), sadece tanıtım amaçlı örnek
   * "Test uzun sohbet" kaydında dolu gelir. Doluysa app/chat/page.tsx
   * handleSelectEntry bunu doğrudan kullanır; yoksa eskisi gibi
   * recipeTitles'tan iki balonluk bir özet üretir. */
  messages?: ChatMessage[];
}

/** Geçmişte tutulan en fazla arama sayısı; localStorage'ın şişmesini önler. */
export const MAX_HISTORY_ENTRIES = 20;

export type HistoryState = HistoryEntry[];

export const HISTORY_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Ekipman + kişi sayısından kısa bir özet üretir (bkz. ChatSidebar, /favorites). */
export function summarizeHistoryEntry(entry: HistoryEntry): string {
  return `${entry.equipment.map((key) => EQUIPMENT_LABELS[key]).join(", ")} · ${entry.personCount} kişilik`;
}

/** Kullanıcı yeniden adlandırmadıysa tarif başlıklarından, o da yoksa
 * ekipman/kişi sayısı özetinden bir görünen başlık türetir. */
export function historyEntryTitle(entry: HistoryEntry): string {
  if (entry.customTitle) return entry.customTitle;
  if (entry.recipeTitles.length > 0) return entry.recipeTitles.join(", ");
  return summarizeHistoryEntry(entry);
}

/** Örnek sohbet başlıkları — sidebar'ı boş bir kullanıcıda bile "yaşayan" bir
 * uygulama gibi göstermek için kullanılan tanıtım verisi (bkz. buildDemoHistory). */
const DEMO_DISHES: string[][] = [
  ["Ispanaklı Omlet"],
  ["Fırında Sebzeli Tavuk"],
  ["Mercimek Çorbası"],
  ["Karnıyarık"],
  ["Mantı", "Yoğurtlu Sos"],
  ["Izgara Köfte"],
  ["Sebzeli Pilav"],
  ["Tavuklu Noodle"],
  ["Patlıcan Musakka"],
  ["Kremalı Mantar Makarna"],
  ["Fırında Somon"],
  ["Nohut Yemeği"],
  ["Kıymalı Börek"],
  ["Sütlaç"],
  ["Tavuk Sote"],
  ["Kabak Mücveri"],
  ["Etli Kuru Fasulye"],
  ["Zeytinyağlı Yaprak Sarma"],
  ["Fırında Patates"],
  ["Tavuklu Sezar Salata"],
];

/** Kaydırma çubuğunun sohbet akışında doğru (ekranın gerçek sağ kenarında)
 * göründüğünü canlıda göstermek için uzun, çok mesajlı örnek bir sohbet —
 * her kullanıcıda "Test uzun sohbet" olarak Favoriler'in başında görünür. */
function buildLongTestConversation(): HistoryEntry {
  const now = Date.now();
  const messages: ChatMessage[] = [];
  let createdAt = now;

  function pushExchange(userText: string, recipeTitle: string) {
    messages.push({ id: `test-convo-u${messages.length}`, role: "user", text: userText, createdAt: createdAt++ });
    messages.push({
      id: `test-convo-a${messages.length}`,
      role: "assistant",
      recipes: [
        {
          equipment: "oven",
          title: recipeTitle,
          steps: ["Fırını ısıt", "Malzemeleri hazırla", "Pişir"],
          videoId: null,
        },
      ],
      createdAt: createdAt++,
    });
  }

  pushExchange("Test uzun sohbet", "Test Tarifi 1");
  for (let i = 1; i <= 7; i++) {
    pushExchange(`Takip sorusu ${i}`, `Test Tarifi ${i + 1}`);
  }

  return {
    id: "demo-long-test-conversation",
    ingredientsText: "Test uzun sohbet",
    hadPhoto: false,
    personCount: 2,
    equipment: ["oven"],
    mode: "home",
    recipeTitles: ["Test Tarifi 8"],
    customTitle: "Test uzun sohbet",
    createdAt: now,
    isFavorite: true,
    messages,
  };
}

function buildDemoHistory(): HistoryState {
  const now = Date.now();
  const dishEntries = DEMO_DISHES.map((recipeTitles, index) => ({
    id: `demo-${index}`,
    ingredientsText: index % 4 === 0 ? undefined : "2 yumurta, biraz sebze, baharatlar",
    hadPhoto: index % 4 === 0,
    personCount: 2 + (index % 4),
    equipment: [
      EQUIPMENT_KEYS[index % EQUIPMENT_KEYS.length],
      EQUIPMENT_KEYS[(index + 3) % EQUIPMENT_KEYS.length],
    ],
    mode: RECIPE_MODE_KEYS[index % RECIPE_MODE_KEYS.length],
    recipeTitles,
    createdAt: now - index * 3600_000,
    isFavorite: index < 5,
  }));

  return [buildLongTestConversation(), ...dishEntries];
}

// İleride e2e testleri bu demo veriyi kapatıp "boş geçmiş" durumunu
// deterministik tutmak için EXPO_PUBLIC_DEMO_HISTORY'yi "false" olarak
// ayarlayabilir — o dışındaki her ortamda (yerel geliştirme, canlı)
// demo veri varsayılan başlangıç durumudur.
const initialState: HistoryState =
  process.env.EXPO_PUBLIC_DEMO_HISTORY === "false" ? [] : buildDemoHistory();

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addHistoryEntry(
      state,
      action: PayloadAction<Omit<HistoryEntry, "id" | "createdAt" | "isFavorite">>,
    ) {
      const entry: HistoryEntry = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        isFavorite: false,
      };
      state.unshift(entry);

      // Favorilenen kayıtlar kırpmadan muaf — sadece favorisiz kayıtlar
      // MAX_HISTORY_ENTRIES'e indirilir, favoriler ne kadar eski olursa olsun kalır.
      let keptNonFavorite = 0;
      const trimmed = state.filter((item) => {
        if (item.isFavorite) return true;
        keptNonFavorite += 1;
        return keptNonFavorite <= MAX_HISTORY_ENTRIES;
      });
      if (trimmed.length !== state.length) {
        state.length = 0;
        state.push(...trimmed);
      }
    },
    toggleHistoryFavorite(state, action: PayloadAction<string>) {
      const entry = state.find((item) => item.id === action.payload);
      if (entry) entry.isFavorite = !entry.isFavorite;
    },
    renameHistoryEntry(state, action: PayloadAction<{ id: string; title: string }>) {
      const entry = state.find((item) => item.id === action.payload.id);
      if (entry) entry.customTitle = action.payload.title.trim() || undefined;
    },
    deleteHistoryEntry(state, action: PayloadAction<string>) {
      return state.filter((item) => item.id !== action.payload);
    },
    setHistory(_state, action: PayloadAction<HistoryState>) {
      return action.payload;
    },
    clearHistory() {
      return [];
    },
  },
});

export const {
  addHistoryEntry,
  toggleHistoryFavorite,
  renameHistoryEntry,
  deleteHistoryEntry,
  setHistory,
  clearHistory,
} = historySlice.actions;
export default historySlice.reducer;
