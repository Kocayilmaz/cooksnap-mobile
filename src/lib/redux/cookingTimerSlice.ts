import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CookingTimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

const DEFAULT_SECONDS = 5 * 60;

const initialState: CookingTimerState = {
  totalSeconds: DEFAULT_SECONDS,
  remainingSeconds: DEFAULT_SECONDS,
  isRunning: false,
};

/**
 * Mutfak zamanlayıcısının durumu artık Redux'ta — hem sohbetteki sidebar
 * widget'ı (bkz. SidebarCookingTimer.tsx) hem de bir tarif adımındaki
 * "10 dk" gibi bir süreye tıklanınca zamanlayıcıyı doğrudan başlatan buton
 * (bkz. RecipeMessageCard.tsx) aynı state'i okuyup yazabilsin diye.
 */
const cookingTimerSlice = createSlice({
  name: "cookingTimer",
  initialState,
  reducers: {
    setDurationSeconds(state, action: PayloadAction<number>) {
      state.totalSeconds = action.payload;
      state.remainingSeconds = action.payload;
      state.isRunning = false;
    },
    startTimer(state) {
      if (state.remainingSeconds <= 0) state.remainingSeconds = state.totalSeconds;
      state.isRunning = true;
    },
    /** Tarif adımından algılanan süreyle (bkz. extractDurationMinutes) zamanlayıcıyı sıfırlayıp başlatır. */
    startWithMinutes(state, action: PayloadAction<number>) {
      const seconds = action.payload * 60;
      state.totalSeconds = seconds;
      state.remainingSeconds = seconds;
      state.isRunning = true;
    },
    pauseTimer(state) {
      state.isRunning = false;
    },
    resetTimer(state) {
      state.isRunning = false;
      state.remainingSeconds = state.totalSeconds;
    },
    tickTimer(state) {
      if (state.remainingSeconds > 0) {
        state.remainingSeconds -= 1;
      } else {
        state.isRunning = false;
      }
    },
  },
});

export const { setDurationSeconds, startTimer, startWithMinutes, pauseTimer, resetTimer, tickTimer } =
  cookingTimerSlice.actions;
export default cookingTimerSlice.reducer;
