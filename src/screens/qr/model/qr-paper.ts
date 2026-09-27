/* eslint-disable house/no-color-literals -- 종이에는 테마가 없다. 자르는 선 색은 역할 토큰이
   아니라 팔레트 `neutral-300`의 라이트 값을 박은 것이고, 근거는
   docs/2-design/modules/attendance/screens/qr.md 의 「내보내기」표다. */

/**
 * 벽에 붙일 A4 한 장이다. 정본은
 * `docs/2-design/modules/attendance/screens/qr.md`의 「내보내기」표고 완료 조건은
 * `docs/2-design/spec/attendance-qr.md`의 AC-03이다.
 *
 * **값이 전부 밀리미터다.** 인쇄된 종이에서 재는 단위라 그렇다. 픽셀 크기를 정해 그림을 굽는
 * 것이 아니라 A4를 그대로 만든다 — 화면에 그린 것을 구우면 크기가 기기 화면에 묶여 인쇄
 * 품질이 관리자 폰마다 달라진다.
 *
 * **자르는 선이 그림 안에 있다.** 가장자리에서 15밀리미터를 들이는 것은 프린터가 삼키는
 * 여백을 넘기기 위해서고, 3밀리미터로 두면 선 자체가 인쇄에서 잘린다.
 *
 * **코드 문자열이 글자로 안 선다.** 종이에 서는 글은 제목과 안내 한 줄뿐이고 코드는
 * `qrSvg`의 경로 안에만 있다.
 */

const CUT_LINE_COLOR = "#CACCCF";

const TITLE = "출근 인증";

const GUIDE = "스마트폰 카메라로 찍어 출근을 인증하세요";

const TITLE_SIZE_MM = 12;

const GUIDE_SIZE_MM = 6;

const QR_GAP_MM = 14;

export const QR_PAPER = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  cutInsetMm: 15,
  cutStrokeMm: 0.25,
  qrRatio: 0.6,
};

export type QrPaperLayout = {
  innerWidthMm: number;
  innerHeightMm: number;
  qrSizeMm: number;
};

/** 자르는 선 안쪽이 종이가 실제로 쓰는 면이고, QR은 그 폭을 기준으로 잡는다. */
export function qrPaperLayout(): QrPaperLayout {
  const innerWidthMm = QR_PAPER.pageWidthMm - QR_PAPER.cutInsetMm * 2;

  return {
    innerWidthMm,
    innerHeightMm: QR_PAPER.pageHeightMm - QR_PAPER.cutInsetMm * 2,
    qrSizeMm: innerWidthMm * QR_PAPER.qrRatio,
  };
}

export type QrPaperHtmlInput = {
  qrSvg: string;
};

export function buildQrPaperHtml({ qrSvg }: QrPaperHtmlInput): string {
  const { innerWidthMm, innerHeightMm, qrSizeMm } = qrPaperLayout();

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<style>
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: white; color: black; }
body {
  width: ${QR_PAPER.pageWidthMm}mm;
  height: ${QR_PAPER.pageHeightMm}mm;
  font-family: sans-serif;
}
.cut {
  box-sizing: border-box;
  margin: ${QR_PAPER.cutInsetMm}mm;
  width: ${innerWidthMm}mm;
  height: ${innerHeightMm}mm;
  border: ${QR_PAPER.cutStrokeMm}mm dashed ${CUT_LINE_COLOR};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.title { font-size: ${TITLE_SIZE_MM}mm; font-weight: 700; }
.qr { width: ${qrSizeMm}mm; height: ${qrSizeMm}mm; margin: ${QR_GAP_MM}mm 0; }
.qr svg { display: block; width: 100%; height: 100%; }
.guide { font-size: ${GUIDE_SIZE_MM}mm; }
</style>
</head>
<body>
<div class="cut">
<div class="title">${TITLE}</div>
<div class="qr">${qrSvg}</div>
<div class="guide">${GUIDE}</div>
</div>
</body>
</html>
`;
}
