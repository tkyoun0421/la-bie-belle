// 구현 대상: src/screens/notifications/utils/nearBottom.utils.ts
//
// 스크롤이 바닥에 얼마나 가까운지를 재는 손이다. 재는 값이 전부 기기가 그려 놓은 길이라
// (`contentOffset`·`layoutMeasurement`·`contentSize`) 화면이 측정하는 쪽이고, 그 측정을
// 받아 다음 쪽을 부를지 정하는 것은 controller다 — `.tsx`가 둘을 한 줄에서 하고 있었다.
//
// 끝에 닿고 나서 부르면 한 박자 빈다. 그래서 바닥에서 한 칸 남았을 때 참이 된다.

import { NEXT_PAGE_SLACK } from "@/screens/notifications/consts/notifications.const";
import { nearBottom } from "@/screens/notifications/utils/nearBottom.utils";

function scrollAt(offsetY: number) {
  return {
    nativeEvent: {
      contentOffset: { x: 0, y: offsetY },
      contentSize: { width: 390, height: 2000 },
      layoutMeasurement: { width: 390, height: 800 },
    },
  } as never;
}

describe("nearBottom — 바닥에서 한 칸 남았는지 잰다", () => {
  it("맨 위면 거짓이다", () => {
    expect(nearBottom(scrollAt(0))).toBe(false);
  });

  it("바닥에 닿으면 참이다", () => {
    expect(nearBottom(scrollAt(1200))).toBe(true);
  });

  it("한 칸 남은 자리가 경계다 — 그 자리부터 참이다", () => {
    const onEdge = 2000 - 800 - NEXT_PAGE_SLACK;

    expect(nearBottom(scrollAt(onEdge))).toBe(true);
    expect(nearBottom(scrollAt(onEdge - 1))).toBe(false);
  });
});
