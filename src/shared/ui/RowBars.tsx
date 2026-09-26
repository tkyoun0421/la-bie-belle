import type { ReactNode } from "react";
import { View } from "react-native";

/**
 * 목록 줄마다 값 아래에 깔리는 가로 막대 묶음이다. 정본은
 * `docs/2-design/design-system/components.md`의 「줄 막대」다.
 *
 * **가장 큰 값이 100%다.** 합이 아니라 최댓값을 기준으로 잡는다. 아홉 포지션 중 하나가
 * 절반을 먹으면 나머지 여덟이 다 짧아져서 서로 견줄 수가 없다. 최댓값은 묶음 전체를 봐야
 * 나오는 수라 줄 하나가 아니라 묶음이 조각의 단위다 — 줄은 `row`로 받아 그대로 세우고 그
 * 아래에 막대만 얹는다.
 *
 * **트랙이 없다.** 빈 자리를 회색으로 깔면 아홉 줄이 전부 두 겹 면이 된다. 막대 하나만
 * 있으면 긴 것과 짧은 것이 그대로 보인다.
 *
 * **값이 0이면 면이 없다.** 1px 선도 안 남긴다 — 빈 줄이 그대로 「여기는 한 달 내내 아무도
 * 안 들어갔다」를 말한다.
 */

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
