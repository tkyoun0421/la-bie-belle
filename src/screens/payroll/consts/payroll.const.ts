import { NO_VALUE } from "@/shared/consts/noValue.const";

export const NO_AMOUNT = NO_VALUE;

export const UNIT_OPTIONS = [
  { value: "week", label: "주" },
  { value: "month", label: "월" },
  { value: "year", label: "연" },
];

export const PAYROLL_COPY = {
  appBarTitle: "급여",
  estimateNote: "예상치예요. 실제 지급액과 다를 수 있어요",
  readFailed: "급여를 불러오지 못했어요",
  retry: "다시 시도",
  emptyTitle: "아직 근무가 없어요",
  emptyBody: "근무한 날이 생기면 여기 서요",
  totalTitle: "합계",
  workLabel: "근무",
  lateLabel: "지각",
};

export const SKELETON_ROWS = [0, 1, 2] as const;

export const SEGMENT_TEST_ID = "payroll-segment";
