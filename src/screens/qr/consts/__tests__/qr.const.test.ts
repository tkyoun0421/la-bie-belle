import { QR_PAPER } from "@/screens/qr/consts/qr.const";

// 구현 대상: src/screens/qr/consts/qr.const.ts
//
// 단언은 `utils/__tests__/qrPaper.utils.test.ts`에서 그대로 옮겼다 — 상수가 `consts`로
// 가면서 짝 테스트도 같이 갈렸다(`fontLoading`이 앞서 밟은 길).

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
