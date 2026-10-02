import {
  CUT_LINE_COLOR,
  GUIDE_SIZE_MM,
  PAPER_GUIDE,
  PAPER_TITLE,
  QR_GAP_MM,
  QR_PAPER,
  TITLE_SIZE_MM,
} from "@/screens/qr/consts/qr.const";

/**
 * 벽에 붙일 A4 한 장이다. 정본은
 * `docs/2-design/modules/attendance/screens/qr.md`의 「내보내기」표고 완료 조건은
 * `docs/2-design/spec/attendance-qr.md`의 AC-03이다.
 *
 * **값은 `consts`가 들고 여기는 짜기만 한다.** 밀리미터로 적는 까닭과 자르는 선 색의 근거가
 * 그 파일에 있다.
 *
 * **자르는 선이 그림 안에 있다.** 가장자리에서 15밀리미터를 들이는 것은 프린터가 삼키는
 * 여백을 넘기기 위해서고, 3밀리미터로 두면 선 자체가 인쇄에서 잘린다.
 *
 * **코드 문자열이 글자로 안 선다.** 종이에 서는 글은 제목과 안내 한 줄뿐이고 코드는
 * `qrSvg`의 경로 안에만 있다.
 */

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
<div class="title">${PAPER_TITLE}</div>
<div class="qr">${qrSvg}</div>
<div class="guide">${PAPER_GUIDE}</div>
</div>
</body>
</html>
`;
}
