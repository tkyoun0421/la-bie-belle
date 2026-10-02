/* eslint-disable house/no-color-literals -- 종이에는 테마가 없다. 자르는 선 색은 역할 토큰이
   아니라 팔레트 `neutral-300`의 라이트 값을 박은 것이고, 근거는
   docs/2-design/modules/attendance/screens/qr.md 의 「내보내기」표다. */

/**
 * QR 화면이 드는 값들이다. 인쇄용 종이 쪽은
 * `docs/2-design/modules/attendance/screens/qr.md`의 「내보내기」표가, 크게 띄우기 쪽은 같은
 * 문서의 「크게 띄우기」표가 정본이다.
 *
 * **종이 값이 전부 밀리미터다.** 인쇄된 종이에서 재는 단위라 그렇다 — 픽셀 크기를 정해
 * 그림을 굽는 것이 아니라 A4를 그대로 만든다.
 */

/** 자르는 선 안쪽이 종이가 실제로 쓰는 면이고, QR은 그 폭을 기준으로 잡는다. */
export const QR_PAPER = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  cutInsetMm: 15,
  cutStrokeMm: 0.25,
  qrRatio: 0.6,
};

export const CUT_LINE_COLOR = "#CACCCF";

export const PAPER_TITLE = "출근 인증";

export const PAPER_GUIDE = "스마트폰 카메라로 찍어 출근을 인증하세요";

export const TITLE_SIZE_MM = 12;

export const GUIDE_SIZE_MM = 6;

export const QR_GAP_MM = 14;

/**
 * 「크게 띄우기」의 QR이 화면 폭에서 비우는 좌우 여백 합이다 — 한쪽에 48px씩이다.
 */
export const FULLSCREEN_QR_MARGIN = 96;
