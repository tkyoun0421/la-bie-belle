import { approvalsLine } from "@/screens/adminHome/utils/approvalsLine.utils";

describe("approvalsLine — 대기 건수를 「승인할 일 · n건」으로 말한다", () => {
  it("3건이면 「승인할 일 · 3건」이다", () => {
    expect(approvalsLine(3)).toBe("승인할 일 · 3건");
  });

  it("0건이어도 줄은 선다 — 「승인할 일 · 0건」이다", () => {
    expect(approvalsLine(0)).toBe("승인할 일 · 0건");
  });
});
