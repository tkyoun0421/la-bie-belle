import { NO_VALUE } from "@/shared/consts/noValue.const";
import type { PayrollDayKind } from "@/entities/payroll/model/payroll.type";

export const NO_AMOUNT = NO_VALUE;

export const ABSENT: PayrollDayKind = "absent";

export const SKELETON_ROWS = [0, 1, 2] as const;

export const PAYROLL_VIEW_COPY = {
  estimateNote: "예상치예요. 실제 지급액과 다를 수 있어요",
  totalTitle: "합계",
  workLabel: "근무",
  lateLabel: "지각",
  historyRow: "내역 보기",
  failed: "급여를 불러오지 못했어요",
  retry: "다시 시도",
};
