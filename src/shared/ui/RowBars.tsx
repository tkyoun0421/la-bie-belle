import type { ReactNode } from "react";
import { View } from "react-native";
import { barWidths } from "@/shared/utils/rowBars.utils";

const BAR_HEIGHT = 4;

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
  const widths = barWidths(items.map((item) => item.value));

  return (
    <View testID={testID}>
      {items.map((item, index) => (
        <View key={item.key}>
          {item.row}
          {widths[index] === null ? null : (
            <View
              testID={testID ? `${testID}-bar-${item.key}` : undefined}
              className="mt-2 rounded-full bg-bg-brand-solid"
              style={{
                height: BAR_HEIGHT,
                width: widths[index],
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
