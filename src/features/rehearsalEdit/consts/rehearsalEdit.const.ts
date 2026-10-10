export const MIN_COUNT = 1;

export const MAX_COUNT = 9;

export const COUNT_MAX_LENGTH = String(MAX_COUNT).length;

export const FORM_COPY = {
  addTitle: "리허설 넣기",
  editTitle: "리허설 고치기",
  timeGuide: "이 날은 근무가 없어서 시각으로 넣어요",
  countGuide: "이 날은 근무가 있어서 건수로 넣어요 · 1건은 1시간이에요",
  addSubmit: "넣기",
  editSubmit: "저장",
};

export const EMPTY_ADD_SHEET_VALUES = {
  startsAt: "",
  endsAt: "",
  count: "",
} as const;
