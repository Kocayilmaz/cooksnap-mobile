import { Pressable, Text, View } from "react-native";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { decrementPersonCount, incrementPersonCount } from "@/lib/redux/personCountSlice";

export default function PersonCountSelector() {
  const count = useAppSelector((state) => state.personCount.value);
  const dispatch = useAppDispatch();

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">Kaç kişilik?</Text>
      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={() => dispatch(decrementPersonCount())}
          className="h-10 w-10 items-center justify-center rounded-full border border-surface-border"
        >
          <Text className="text-xl leading-none text-foreground">−</Text>
        </Pressable>
        <Text className="w-8 text-center text-lg font-semibold text-brand-orange">{count}</Text>
        <Pressable
          onPress={() => dispatch(incrementPersonCount())}
          className="h-10 w-10 items-center justify-center rounded-full border border-surface-border"
        >
          <Text className="text-xl leading-none text-foreground">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
