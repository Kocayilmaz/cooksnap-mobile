import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

/** Ücretsiz moddaki günlük istek limiti; aşılınca kullanıcı premium anahtar girmeye yönlendirilir. */
export const FREE_USAGE_LIMIT = 5;

/** Bu süre sonunda ücretsiz mod sayacı otomatik olarak sıfırlanır (bkz. StoreProvider). */
export const USAGE_RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface UsageCounterState {
  count: number;
  /** Sayacın en son sıfırlandığı an (epoch ms); 24 saat dolduğunda tekrar sıfırlanır. */
  lastResetAt: number;
}

const initialState: UsageCounterState = {
  count: 0,
  lastResetAt: Date.now(),
};

const usageCounterSlice = createSlice({
  name: "usageCounter",
  initialState,
  reducers: {
    incrementUsage(state) {
      state.count += 1;
    },
    setUsage(_state, action: PayloadAction<UsageCounterState>) {
      return action.payload;
    },
  },
});

export const { incrementUsage, setUsage } = usageCounterSlice.actions;
export default usageCounterSlice.reducer;
