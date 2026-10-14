import { Appearance } from "react-native";

export function stubAppearance(stub: Partial<typeof Appearance>): void {
  Object.assign(Appearance, stub);
}
