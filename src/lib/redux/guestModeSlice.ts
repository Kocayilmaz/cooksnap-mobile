import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface GuestModeState {
  isGuest: boolean;
}

const initialState: GuestModeState = {
  isGuest: false,
};

const guestModeSlice = createSlice({
  name: "guestMode",
  initialState,
  reducers: {
    setGuestMode(state, action: PayloadAction<boolean>) {
      state.isGuest = action.payload;
    },
  },
});

export const { setGuestMode } = guestModeSlice.actions;
export default guestModeSlice.reducer;
