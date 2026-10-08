import { useEffect } from "react";
import { BackHandler } from "react-native";

export type BackPressSource = {
  addEventListener: (
    event: "hardwareBackPress",
    listener: () => boolean,
  ) => { remove: () => void };
};

export function useHardwareBack(
  onBack: (() => boolean) | null,
  source: BackPressSource = BackHandler,
): void {
  useEffect(() => {
    if (onBack === null) {
      return;
    }

    const subscription = source.addEventListener("hardwareBackPress", onBack);

    return () => subscription.remove();
  }, [onBack, source]);
}
