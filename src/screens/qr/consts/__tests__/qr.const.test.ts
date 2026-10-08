import { QR_PAPER } from "@/screens/qr/consts/qr.const";

describe("QR_PAPER — 인쇄용 종이 상수", () => {
  it("정한 값 그대로다", () => {
    expect(QR_PAPER).toEqual({
      pageWidthMm: 210,
      pageHeightMm: 297,
      cutInsetMm: 15,
      cutStrokeMm: 0.25,
      qrRatio: 0.6,
    });
  });
});
