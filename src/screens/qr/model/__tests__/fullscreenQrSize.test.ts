import { fullscreenQrSize } from "@/screens/qr/model/fullscreenQrSize";

describe("fullscreenQrSize — 화면 폭에서 좌우 96px을 뺀 크기다", () => {
  it("390이면 294다", () => {
    expect(fullscreenQrSize(390)).toBe(294);
  });

  it("97이면 1이다", () => {
    expect(fullscreenQrSize(97)).toBe(1);
  });

  it("96이면 0이다", () => {
    expect(fullscreenQrSize(96)).toBe(0);
  });

  it("96보다 작으면 음수가 아니라 0이다", () => {
    expect(fullscreenQrSize(50)).toBe(0);
  });
});
