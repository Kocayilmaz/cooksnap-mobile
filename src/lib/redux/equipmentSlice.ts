import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Equipment =
  | "oven"
  | "pan"
  | "pot"
  | "airfryer"
  | "microwave"
  | "pressureCooker"
  | "toasterOven"
  | "grill"
  | "slowCooker"
  | "wok";

export const EQUIPMENT_KEYS: Equipment[] = [
  "oven",
  "pan",
  "pot",
  "airfryer",
  "microwave",
  "pressureCooker",
  "toasterOven",
  "grill",
  "slowCooker",
  "wok",
];

/**
 * Türkçe ekipman etiketleri; hem seçim ekranında (EquipmentSelector) hem de
 * favori tarifleri listeleyen sayfada (app/favorites) kullanılır, bu yüzden
 * burada merkezi tutuluyor.
 */
export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  oven: "Fırın",
  pan: "Tava",
  pot: "Tencere",
  airfryer: "Airfryer",
  microwave: "Mikrodalga",
  pressureCooker: "Düdüklü Tencere",
  toasterOven: "Tost Makinesi",
  grill: "Izgara",
  slowCooker: "Yavaş Pişirici",
  wok: "Wok",
};

type EquipmentState = Record<Equipment, boolean>;

const initialState: EquipmentState = {
  oven: true,
  pan: true,
  pot: false,
  airfryer: false,
  microwave: false,
  pressureCooker: false,
  toasterOven: false,
  grill: false,
  slowCooker: false,
  wok: false,
};

const equipmentSlice = createSlice({
  name: "equipment",
  initialState,
  reducers: {
    toggleEquipment(state, action: PayloadAction<Equipment>) {
      state[action.payload] = !state[action.payload];
    },
    setEquipment(_state, action: PayloadAction<EquipmentState>) {
      return action.payload;
    },
  },
});

export const { toggleEquipment, setEquipment } = equipmentSlice.actions;
export default equipmentSlice.reducer;
