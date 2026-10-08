/* eslint-disable house/no-color-literals -- 종이에는 테마가 없다. 자르는 선 색은 역할 토큰이
   아니라 팔레트 `neutral-300`의 라이트 값을 박은 것이고, 근거는
   docs/2-design/modules/attendance/screens/qr.md 의 「내보내기」표다. */

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

export const FULLSCREEN_QR_MARGIN = 96;

export const QR_SCREEN_COPY = {
  appBarTitle: "QR",
  exportPaper: "내보내기",
  fullscreen: "크게 띄우기",
  rotate: "새로 뽑기",
  rotateTitle: "QR을 새로 뽑을까요?",
  rotateBody: "지금 QR이 바로 끝나요. 홀에 붙여둔 종이도 갈아야 해요",
  rotateDone: "QR을 새로 뽑았어요",
  paperFailed: "종이를 못 만들었어요. 다시 눌러주세요",
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
  close: "닫기",
};

export const ROTATE_CONFIRM_TEST_ID = "qr-rotate-confirm-button";
