const DEADLINE_REQUIRED_MESSAGE = "마감일을 입력해 주세요";
const DEADLINE_BEFORE_TODAY_MESSAGE = "마감일은 오늘 이후로 입력해 주세요";
const DEADLINE_AFTER_WORK_DATE_MESSAGE = "마감일은 근무일 이전이어야 해요";

export type ValidateManageDeadlineParams = { deadline: string; today: string; workDate: string };

export function validateManageDeadline({
  deadline,
  today,
  workDate,
}: ValidateManageDeadlineParams): string | null {
  if (deadline.length === 0) {
    return DEADLINE_REQUIRED_MESSAGE;
  }
  if (deadline < today) {
    return DEADLINE_BEFORE_TODAY_MESSAGE;
  }
  if (deadline > workDate) {
    return DEADLINE_AFTER_WORK_DATE_MESSAGE;
  }
  return null;
}
