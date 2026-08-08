import { startOfMonth } from "date-fns";

import { listOwnApplications } from "@/entities/schedule/api/list-own-applications";
import { listRecruitmentSchedules } from "@/entities/schedule/api/list-recruitment-schedules";
import { GENERAL_CONFIRMATION } from "@/entities/schedule/model/confirmation.mock";
import { deriveScheduleDetailVariant } from "@/views/schedule-detail/model/schedule-detail-variant";
import { ScheduleDetailClosedView } from "@/views/schedule-detail/ui/ScheduleDetailClosedView";
import { ScheduleDetailView } from "@/views/schedule-detail/ui/ScheduleDetailView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";
import { NotFoundScreen } from "@/views/status/ui/NotFoundScreen";

const WORK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ScheduleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  const { id } = await params;

  if (!WORK_DATE_PATTERN.test(id)) {
    return <NotFoundScreen />;
  }

  const month = startOfMonth(new Date(`${id}T00:00:00`));
  const schedulesResult = await listRecruitmentSchedules({ month });
  if (!schedulesResult.ok) {
    return <ErrorScreen />;
  }

  const schedule = schedulesResult.data.find(
    (entry) => entry.workDate === id && entry.status !== "CANCELLED",
  );
  if (schedule === undefined) {
    return <NotFoundScreen />;
  }

  const variant = deriveScheduleDetailVariant(schedule.status);
  if (variant === "closed") {
    const applicationsResult = await listOwnApplications({ scheduleIds: [schedule.id] });
    if (!applicationsResult.ok) {
      return <ErrorScreen />;
    }
    const ownApplicationStatus = applicationsResult.data[0]?.status ?? null;

    return (
      <ScheduleDetailClosedView
        workDate={schedule.workDate}
        ownApplicationStatus={ownApplicationStatus}
      />
    );
  }

  return <ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />;
}
