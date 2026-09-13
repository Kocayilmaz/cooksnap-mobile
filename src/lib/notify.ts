import { Alert, ToastAndroid } from "react-native";

/** Android'de kısa ömürlü bir toast, diğer platformlarda (ör. web) Alert'e düşer. */
export function notify(message: string) {
  if (ToastAndroid) ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert(message);
}
