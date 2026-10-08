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
