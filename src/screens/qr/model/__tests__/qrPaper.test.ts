import {
  QR_PAPER,
  qrPaperLayout,
  buildQrPaperHtml,
} from "@/screens/qr/model/qr-paper";

const FAKE_QR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><path d="fake-qr-marker-9f3a"/></svg>';

describe("qrPaperLayout — A4 안쪽 크기와 QR 크기를 셈한다", () => {
  it("자르는 선 안쪽 폭은 페이지 폭에서 좌우 여백을 뺀 값이다", () => {
    expect(qrPaperLayout().innerWidthMm).toBe(180);
  });

  it("자르는 선 안쪽 높이는 페이지 높이에서 상하 여백을 뺀 값이다", () => {
    expect(qrPaperLayout().innerHeightMm).toBe(267);
  });

  it("QR 크기는 안쪽 폭의 60%다", () => {
    expect(qrPaperLayout().qrSizeMm).toBe(108);
  });
});

describe("buildQrPaperHtml — 인쇄용 종이 HTML을 만든다", () => {
  it("A4 페이지 크기 210mm를 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain("210mm");
  });

  it("A4 페이지 크기 297mm를 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain("297mm");
  });

  it("자르는 선의 안쪽 여백 15mm를 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain("15mm");
  });

  it("자르는 선의 굵기 0.25mm를 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain("0.25mm");
  });

  it("QR 폭 108mm를 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain("108mm");
  });

  it("제목 「출근 인증」을 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain("출근 인증");
  });

  it("안내 「스마트폰 카메라로 찍어 출근을 인증하세요」를 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain(
      "스마트폰 카메라로 찍어 출근을 인증하세요",
    );
  });

  it("자르는 선 색 #CACCCF를 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain("#CACCCF");
  });

  it("건네준 qrSvg 문자열을 그대로 담는다", () => {
    expect(buildQrPaperHtml({ qrSvg: FAKE_QR_SVG })).toContain(FAKE_QR_SVG);
  });

  it("qrSvg 밖에는 코드 문자열이 글자로 안 선다", () => {
    const html = buildQrPaperHtml({ qrSvg: FAKE_QR_SVG });

    const withoutSvg = html.replace(FAKE_QR_SVG, "");

    expect(withoutSvg).not.toContain("fake-qr-marker-9f3a");
  });
});

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
