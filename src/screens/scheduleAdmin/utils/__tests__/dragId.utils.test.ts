// 구현 대상: src/screens/scheduleAdmin/utils/dragId.utils.ts
//
// 끌기 식별자의 꼴이다. 접두사가 `PositionRow.tsx`에만 있을 때는 집는 쪽과 받는 쪽이 같은
// 파일이라 글자를 직접 이어 붙여도 됐는데, 「받아도 되나」를 controller가 판정하면서 같은
// 접두사를 두 파일이 알아야 하게 됐다 — 꼴을 아는 자리를 하나로 둔다.

import {
  DISCARD_DROP_ID,
  positionDragId,
  positionOf,
  slotDragId,
  slotOf,
} from "@/screens/scheduleAdmin/utils/dragId.utils";

describe("dragId — 줄 머리와 자리와 버리는 영역이 한 이름 공간을 나눠 쓴다", () => {
  it("줄 머리와 자리가 서로 다른 접두사를 쓴다", () => {
    expect(positionDragId("스캔")).not.toBe(slotDragId("스캔"));
  });

  it("지은 식별자를 그대로 되읽는다", () => {
    expect(positionOf(positionDragId("드레스실"))).toBe("드레스실");
    expect(slotOf(slotDragId("s1"))).toBe("s1");
  });

  it("남의 꼴은 null이다 — 자리 식별자를 줄 머리로 읽지 않는다", () => {
    expect(positionOf(slotDragId("s1"))).toBeNull();
    expect(slotOf(positionDragId("스캔"))).toBeNull();
    expect(positionOf(DISCARD_DROP_ID)).toBeNull();
    expect(slotOf(DISCARD_DROP_ID)).toBeNull();
  });
});
