export const MIN_COUNT = 1;

export const MAX_COUNT = 9;

export const COUNT_MAX_LENGTH = String(MAX_COUNT).length;

export const CLOCK_LENGTH = 5;

export const MIN_ROWS_FOR_TOTAL = 2;

export const MONTH_CHEVRON_SIZE = 14;

export const REHEARSAL_COPY = {
  appBarTitle: "리허설",
  legend: "칸 아래 숫자는 그날 리허설 시간이에요",
  readFailed: "리허설을 불러오지 못했어요",
  retry: "다시 시도",
  removeTitle: "이 리허설을 지울까요?",
  removeBody: "급여에서도 빠져요",
  removeCancel: "그만두기",
  removeConfirm: "지우기",
};

export const FORM_COPY = {
  addTitle: "리허설 넣기",
  editTitle: "리허설 고치기",
  timeGuide: "이 날은 근무가 없어서 시각으로 넣어요",
  countGuide: "이 날은 근무가 있어서 건수로 넣어요 · 1건은 1시간이에요",
  addSubmit: "넣기",
  editSubmit: "저장",
};

export const MONTH_TEST_ID = "rehearsal-month";

export const REMOVE_CONFIRM_TEST_ID = "rehearsal-remove-confirm-button";

export const EMPTY_ADD_SHEET_VALUES = {
  startsAt: "",
  endsAt: "",
  count: "",
} as const;

export const INITIAL_ADD_SHEET = {
  formKind: "time",
  values: EMPTY_ADD_SHEET_VALUES,
  notice: null,
} as const;
