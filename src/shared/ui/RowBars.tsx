import type { ReactNode } from "react";
import { View } from "react-native";

const BAR_HEIGHT = 4;

const FULL = 100;

export type RowBarsItem = {
  key: string;
  value: number;
  row: ReactNode;
};

export type RowBarsProps = {
  items: RowBarsItem[];
  testID?: string;
};

export function RowBars({ items, testID }: RowBarsProps) {
  const highest = Math.max(0, ...items.map((item) => item.value));

  return (
    <View testID={testID}>
      {items.map((item) => (
        <View key={item.key}>
          {item.row}
          {item.value > 0 && highest > 0 ? (
            <View
              testID={testID ? `${testID}-bar-${item.key}` : undefined}
              className="mt-2 rounded-full bg-bg-brand-solid"
              style={{
                height: BAR_HEIGHT,
                width: `${(item.value / highest) * FULL}%`,
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
