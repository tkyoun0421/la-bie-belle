import { NEXT_PAGE_SLACK } from "@/entities/notification/consts/notification.const";
import { nearBottom } from "@/entities/notification/utils/nearBottom.utils";

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
