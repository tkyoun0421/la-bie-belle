import { format } from "date-fns";

import { countApplicationsByMonth } from "@/entities/schedule/api/count-applications-by-month";
import { listRecruitmentSchedules } from "@/entities/schedule/api/list-recruitment-schedules";
import { extendRecruitmentDeadline } from "@/features/recruitment/api/extend-recruitment-deadline";
import { listApplicantsByScheduleAction } from "@/features/recruitment/api/list-applicants-by-schedule.action";
import { openRecruitmentSchedules } from "@/features/recruitment/api/open-recruitment-schedules";
import { reopenRecruitmentSchedule } from "@/features/recruitment/api/reopen-recruitment-schedule";
import { RouteTransition } from "@/shared/ui/route-transition";
import { RecruitmentOpenView } from "@/views/admin-recruitment/ui/RecruitmentOpenView";
import { parseRecruitmentMonthParam } from "@/views/admin-recruitment/model/recruitment-month";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

function seoulToday(): string {
  return SEOUL_DATE_FORMATTER.format(new Date());
}

type AdminRecruitmentPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function AdminRecruitmentPage({ searchParams }: AdminRecruitmentPageProps) {
  const resolvedSearchParams = await searchParams;
  const today = seoulToday();
  const month = parseRecruitmentMonthParam(resolvedSearchParams.month, today);

  const schedulesResult = await listRecruitmentSchedules({ month });

  if (!schedulesResult.ok) {
    return <ErrorScreen />;
  }

  const countsResult = await countApplicationsByMonth({
    scheduleIds: schedulesResult.data.map((schedule) => schedule.id),
  });
  const applicationCounts = countsResult.ok ? countsResult.data : [];

  return (
    <RouteTransition>
      <RecruitmentOpenView
        month={format(month, "yyyy-MM")}
        today={today}
        schedules={schedulesResult.data}
        applicationCounts={applicationCounts}
        onOpen={openRecruitmentSchedules}
        onExtend={extendRecruitmentDeadline}
        onReopen={reopenRecruitmentSchedule}
        onListApplicants={listApplicantsByScheduleAction}
      />
    </RouteTransition>
  );
}
