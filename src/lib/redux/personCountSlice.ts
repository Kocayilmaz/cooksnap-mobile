import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const MIN_PEOPLE = 1;
const MAX_PEOPLE = 12;

interface PersonCountState {
  value: number;
}

const initialState: PersonCountState = {
  value: 2,
};

const personCountSlice = createSlice({
  name: "personCount",
  initialState,
  reducers: {
    setPersonCount(state, action: PayloadAction<number>) {
      state.value = Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, action.payload));
    },
    incrementPersonCount(state) {
      state.value = Math.min(MAX_PEOPLE, state.value + 1);
    },
    decrementPersonCount(state) {
      state.value = Math.max(MIN_PEOPLE, state.value - 1);
    },
  },
});

export const { setPersonCount, incrementPersonCount, decrementPersonCount } =
  personCountSlice.actions;
export default personCountSlice.reducer;
