import { cancelRequestBadge } from "@/entities/schedule/model/cancelRequestSheet.policy";

describe("cancelRequestBadge — 살아 있는 취소 요청이면 「취소 요청 중」이다", () => {
  it("살아 있으면 배지 문구를 낸다", () => {
    expect(cancelRequestBadge(true)).toBe("취소 요청 중");
  });

  it("없으면 null이다", () => {
    expect(cancelRequestBadge(false)).toBeNull();
  });
});
