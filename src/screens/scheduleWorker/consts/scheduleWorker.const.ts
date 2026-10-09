export const CANCEL_REASON_MAX_LENGTH = 100;

export const ROSTER_MAX_HEIGHT = 360;

export const SKELETON_ROWS = [0, 1, 2];

export const SCHEDULE_WORKER_COPY = {
  submit: "보내기",
  mineOnly: "내 근무만",
  calendarView: "달력 순",
  positionView: "포지션 순",
  calendarNote: "점이 내 근무예요",
  calendarNoteWithRequest: "점이 내 근무, 도는 점선이 근무 요청이에요",
  awaitingConfirmation: "근무표를 만들고 있어요. 확정되면 여기에 보여요",
  seatTaken: "자리가 찼어요",
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
} as const;
