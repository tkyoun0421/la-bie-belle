import { format, startOfMonth } from "date-fns";

import { listOwnApplications } from "@/entities/schedule/api/list-own-applications";
import { listRecruitmentSchedules } from "@/entities/schedule/api/list-recruitment-schedules";
import { mapRecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import { applyRecruitmentChanges } from "@/features/application/api/apply-recruitment-changes";
import { ScheduleView } from "@/views/schedule/ui/ScheduleView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;
const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

function seoulToday(): string {
  return SEOUL_DATE_FORMATTER.format(new Date());
}

function parseMonthParam(value: string | undefined): Date {
  if (value !== undefined && MONTH_PARAM_PATTERN.test(value)) {
    const parsed = new Date(`${value}-01T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return startOfMonth(parsed);
    }
  }
  return startOfMonth(new Date(`${seoulToday()}T00:00:00`));
}

type SchedulePageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const resolvedSearchParams = await searchParams;
  const month = parseMonthParam(resolvedSearchParams.month);
  const today = seoulToday();

  const schedulesResult = await listRecruitmentSchedules({ month });
  if (!schedulesResult.ok) {
    return <ErrorScreen />;
  }

  const scheduleIds = schedulesResult.data.map((schedule) => schedule.id);
  const applicationsResult = await listOwnApplications({ scheduleIds });
  if (!applicationsResult.ok) {
    return <ErrorScreen />;
  }

  const applicationStatusByScheduleId = new Map(
    applicationsResult.data.map((application) => [application.scheduleId, application.status]),
  );
  const schedules = schedulesResult.data.map((schedule) =>
    mapRecruitmentScheduleWithApplication(schedule, applicationStatusByScheduleId),
  );

  return (
    <ScheduleView
      month={format(month, "yyyy-MM")}
      today={today}
      schedules={schedules}
      onApply={applyRecruitmentChanges}
    />
  );
}
