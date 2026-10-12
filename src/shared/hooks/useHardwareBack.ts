import { useEffect, useEffectEvent } from "react";
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
  const listening = onBack !== null;
  const pressBack = useEffectEvent(() => onBack?.() ?? false);

  useEffect(() => {
    if (!listening) {
      return;
    }

    const subscription = source.addEventListener("hardwareBackPress", () =>
      pressBack(),
    );

    return () => subscription.remove();
  }, [listening, source]);
}
