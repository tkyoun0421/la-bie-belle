import { qrStartLine } from "@/screens/qr/model/qr-start-line";

describe("qrStartLine — 지금 코드를 쓰기 시작한 날을 KST로 알린다", () => {
  it("KST로 같은 날이면 그 날짜로 적는다", () => {
    expect(qrStartLine("2026-03-02T02:00:00Z")).toBe(
      "2026년 3월 2일부터 쓰고 있어요",
    );
  });

  it("UTC로 전날 15:30이어도 KST 자정을 넘겨 다음 날로 적는다", () => {
    expect(qrStartLine("2026-03-01T15:30:00Z")).toBe(
      "2026년 3월 2일부터 쓰고 있어요",
    );
  });

  it("KST 자정 직전(14:59)이면 아직 전날이다", () => {
    expect(qrStartLine("2026-03-01T14:59:00Z")).toBe(
      "2026년 3월 1일부터 쓰고 있어요",
    );
  });

  it("해가 달라도 연도가 항상 붙는다", () => {
    expect(qrStartLine("2025-12-31T02:00:00Z")).toBe(
      "2025년 12월 31일부터 쓰고 있어요",
    );
  });
});
