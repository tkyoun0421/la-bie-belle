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

/**
 * 화면에 뜨는 글자다. 정본은
 * `docs/2-design/modules/attendance/screens/qr.md`의 문안 표다.
 *
 * **`sendFailed`는 저장소를 가로지르는 사본 여섯 중 하나다** — 통신이 끊겼을 때의 기본
 * 문장이고 정본은 `docs/2-design/system/data-access.md`의 「오류의 모양」이다. 여기 한 벌을
 * 두는 것은 묶음 하나가 그 여섯을 못 접기 때문이고, 접는 자리는 사본 묶음 task가 정한다.
 */
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

/** e2e가 화면 뒤에 깔린 같은 글자의 버튼과 가르는 손이다 — `tests/e2e/qr.yaml`. */
export const ROTATE_CONFIRM_TEST_ID = "qr-rotate-confirm-button";
