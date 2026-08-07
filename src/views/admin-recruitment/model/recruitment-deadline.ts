import { earliestRecruitmentDate } from "@/views/admin-recruitment/model/recruitment-selection";

const DEADLINE_REQUIRED_MESSAGE = "마감일을 입력해 주세요";
const DEADLINE_BEFORE_TODAY_MESSAGE = "마감일은 오늘 이후로 입력해 주세요";
const DEADLINE_AFTER_EARLIEST_MESSAGE = "마감일은 가장 이른 선택 날짜 이전이어야 해요";

export type ValidateRecruitmentDeadlineParams = {
  deadline: string;
  selectedDates: ReadonlySet<string>;
  today: string;
};

export function validateRecruitmentDeadline({
  deadline,
  selectedDates,
  today,
}: ValidateRecruitmentDeadlineParams): string | null {
  if (deadline.length === 0) {
    return DEADLINE_REQUIRED_MESSAGE;
  }
  if (deadline < today) {
    return DEADLINE_BEFORE_TODAY_MESSAGE;
  }

  const earliest = earliestRecruitmentDate(selectedDates);
  if (earliest !== null && deadline > earliest) {
    return DEADLINE_AFTER_EARLIEST_MESSAGE;
  }

  return null;
}
