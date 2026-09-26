import { View } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 한 줄 안에서 전체를 몫으로 가르는 띠다. 정본은
 * `docs/2-design/design-system/components.md`의 「비율 띠」고, 넷째 몫이 중립인 근거는
 * `docs/2-design/system/screens/stats.md`의 「근태 현황 줄」이다.
 *
 * **색이 갈리는 유일한 조각이다.** 차트 넷 중 나머지 셋은 브랜드 하나로 끝난다 — 한 그림
 * 안에 다른 종류가 섞이는 자리가 여기뿐이다. 색은 자리 순서가 가지므로 몫이 빠져도 남은
 * 몫의 색이 안 밀린다.
 *
 * **범례를 띠 안에 안 넣는다.** 몫이 작으면 글자가 안 들어가고, 들어가도 면 색 위라 대비가
 * 몫마다 달라진다.
 *
 * **몫이 0이면 그 색이 아예 없다.** 범례에서도 빠진다 — 지각이 0인 달에 「지각 0」이
 * 범례에 서면 없는 것을 세 번 말하게 된다.
 *
 * 라운딩이 양 끝에만 남는 것은 띠 전체를 `rounded-full`로 깎고 몫을 그 안에 가두기
 * 때문이다. 몫 사이 2px 틈은 띠 바탕이 그대로 비치는 자리다.
 */

const BAND_HEIGHT = 8;

const SHARE_GAP = 2;

const LEGEND_DOT_SIZE = 4;

/** 첫째가 브랜드, 둘째가 sky, 셋째가 mint, 넷째는 「아무것도 안 일어난 몫」이라 중립이다. */
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
            <Text className="text-xs text-fg-neutral-muted tabular-nums">
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
