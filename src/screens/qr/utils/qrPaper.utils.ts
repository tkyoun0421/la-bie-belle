import {
  CUT_LINE_COLOR,
  GUIDE_SIZE_MM,
  PAPER_GUIDE,
  PAPER_TITLE,
  QR_GAP_MM,
  QR_PAPER,
  TITLE_SIZE_MM,
} from "@/screens/qr/consts/qr.const";

export type QrPaperLayout = {
  innerWidthMm: number;
  innerHeightMm: number;
  qrSizeMm: number;
};

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
