import { useCallback, useState } from "react";

type PressTokens = Record<string, number>;

export function useTabPressAnimation() {
  const [pressTokens, setPressTokens] = useState<PressTokens>({});

  const onTabPress = useCallback((tabKey: string) => {
    setPressTokens((current) => ({
      ...current,
      [tabKey]: (current[tabKey] ?? 0) + 1,
    }));
  }, []);

  const pressTokenFor = useCallback((tabKey: string) => pressTokens[tabKey] ?? 0, [pressTokens]);

  return { onTabPress, pressTokenFor };
}
