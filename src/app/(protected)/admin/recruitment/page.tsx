import { startOfMonth } from "date-fns";

import { listRecruitmentSchedules } from "@/entities/schedule/api/list-recruitment-schedules";
import { extendRecruitmentDeadline } from "@/features/recruitment/api/extend-recruitment-deadline";
import { openRecruitmentSchedules } from "@/features/recruitment/api/open-recruitment-schedules";
import { reopenRecruitmentSchedule } from "@/features/recruitment/api/reopen-recruitment-schedule";
import { RecruitmentOpenView } from "@/views/admin-recruitment/ui/RecruitmentOpenView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;
const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

function seoulToday(): string {
  return SEOUL_DATE_FORMATTER.format(new Date());
}

function parseMonthParam(value: string | undefined): Date {
  if (value !== undefined && MONTH_PARAM_PATTERN.test(value)) {
    const parsed = new Date(`${value}-01T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return startOfMonth(parsed);
    }
  }
  return startOfMonth(new Date(`${seoulToday()}T00:00:00Z`));
}

type AdminRecruitmentPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function AdminRecruitmentPage({ searchParams }: AdminRecruitmentPageProps) {
  const resolvedSearchParams = await searchParams;
  const month = parseMonthParam(resolvedSearchParams.month);
  const today = seoulToday();

  const schedulesResult = await listRecruitmentSchedules({ month });

  if (!schedulesResult.ok) {
    return <ErrorScreen />;
  }

  return (
    <RecruitmentOpenView
      month={month}
      today={today}
      schedules={schedulesResult.data}
      onOpen={openRecruitmentSchedules}
      onExtend={extendRecruitmentDeadline}
      onReopen={reopenRecruitmentSchedule}
    />
  );
}
