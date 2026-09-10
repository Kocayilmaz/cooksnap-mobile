import { Pressable, Text, View } from "react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleEquipment, EQUIPMENT_LABELS, type Equipment } from "@/lib/redux/equipmentSlice";

export default function EquipmentSelector() {
  const equipment = useAppSelector((state) => state.equipment);
  const dispatch = useAppDispatch();

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">Elinde ne var?</Text>
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((key) => {
          const active = equipment[key];
          return (
            <Pressable
              key={key}
              onPress={() => dispatch(toggleEquipment(key))}
              className={`rounded-full border px-4 py-2 ${active ? "border-brand-orange bg-brand-orange" : "border-surface-border"}`}
            >
              <Text className={`text-sm font-medium ${active ? "text-white" : "text-foreground"}`}>
                {EQUIPMENT_LABELS[key]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
