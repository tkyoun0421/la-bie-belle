/**
 * 근무자가 보는 근무표 화면이 쓰는 문안과 정해진 값이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleWorker.md`의 문안 표다.
 *
 * **보기 전환 표는 여기 없다.** 달력 순·포지션 순이 글자가 아니라 아이콘으로 서는데 그
 * 아이콘이 컴포넌트라 `.ts`가 못 든다 — 값과 아이콘과 읽어 주는 말이 한 줄로 묶여야 해서
 * 표째로 [`ScheduleWorkerScreen`](../ui/ScheduleWorkerScreen.tsx)에 남는다.
 *
 * **달이 들어가는 문구도 여기 없다.** 「10월 근무 신청을 보냈어요」처럼 값을 받아 서는 넷은
 * [`workerCopy.utils.ts`](../utils/workerCopy.utils.ts)가 짓는다.
 */

/**
 * 취소 사유 상한이다. `create_cancel_request`와 같은 수라야 화면이 눌리게 둔 글이 서버에서
 * 거절당하지 않는다 — 글자를 막는 `Input`과 보내기를 가르는 판정이 같은 수를 봐야 해서
 * `.tsx`와 `model`에 한 벌씩 있던 것을 여기로 모았다.
 */
export const CANCEL_REASON_MAX_LENGTH = 100;

/** 명단이 길어도 시트가 화면을 다 먹지 않게 자르는 높이다. */
export const ROSTER_MAX_HEIGHT = 360;

export const SCHEDULE_WORKER_COPY = {
  submit: "보내기",
  mineOnly: "내 근무만",
  calendarView: "달력 순",
  positionView: "포지션 순",
  calendarNote: "점이 내 근무예요",
  calendarNoteWithRequest: "점이 내 근무, 도는 점선이 근무 요청이에요",
  awaitingConfirmation: "근무표를 만들고 있어요. 확정되면 여기에 보여요",
  seatTaken: "자리가 찼어요",
  /**
   * 같은 글자가 저장소 여섯 자리에 있다. 묶음을 가로지르는 사본이라 한 열이 못 접고
   * AC-13이 받는다.
   */
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
} as const;
