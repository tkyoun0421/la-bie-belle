import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const BAND_HEIGHT = 8;

const SHARE_GAP = 2;

const LEGEND_DOT_SIZE = 4;

const SHARE_FILLS = [
  "bg-bg-brand-solid",
  "bg-bg-sky",
  "bg-bg-mint",
  "bg-bg-neutral-weak",
];

export type RatioBandShare = {
  key: string;
  label: string;
  value: number;
};

export type RatioBandProps = {
  shares: RatioBandShare[];
  testID?: string;
};

export function RatioBand({ shares, testID }: RatioBandProps) {
  const drawn = shares
    .map((share, position) => ({ share, fill: fillAt(position) }))
    .filter((entry) => entry.share.value > 0);

  return (
    <View testID={testID}>
      <View
        className="flex-row overflow-hidden rounded-full bg-bg-neutral"
        style={{ height: BAND_HEIGHT, gap: SHARE_GAP }}
      >
        {drawn.map((entry) => (
          <View
            key={entry.share.key}
            testID={testID ? `${testID}-share-${entry.share.key}` : undefined}
            className={entry.fill}
            style={{ flexGrow: entry.share.value, flexBasis: 0 }}
          />
        ))}
      </View>

      <View className="mt-2 flex-row flex-wrap items-center gap-4">
        {drawn.map((entry) => (
          <View key={entry.share.key} className="flex-row items-center gap-1.5">
            <View
              className={cn("rounded-full", entry.fill)}
              style={{ width: LEGEND_DOT_SIZE, height: LEGEND_DOT_SIZE }}
            />
            <Text
              testID={
                testID ? `${testID}-legend-${entry.share.key}` : undefined
              }
              className="text-xs text-fg-neutral-muted tabular-nums"
            >
              {entry.share.label} {entry.share.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function fillAt(position: number): string {
  return SHARE_FILLS[Math.min(position, SHARE_FILLS.length - 1)];
}
