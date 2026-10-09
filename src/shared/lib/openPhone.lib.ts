import { Linking } from "react-native";

export function openPhone(phone: string): void {
  void Linking.openURL(`tel:${phone}`);
}
