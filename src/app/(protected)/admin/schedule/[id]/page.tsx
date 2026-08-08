import { getSchedulePrep } from "@/entities/schedule/api/get-schedule-prep";
import { replaceCeremonies } from "@/features/ceremony/api/replace-ceremonies";
import { setPlannedTimes } from "@/features/ceremony/api/set-planned-times";
import {
  createCheckInRule,
  deleteCheckInRule,
  updateCheckInRule,
} from "@/features/ceremony/api/manage-checkin-rules";
import { AdminSchedulePrepView } from "@/views/admin-schedule/ui/AdminSchedulePrepView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";
import { NotFoundScreen } from "@/views/status/ui/NotFoundScreen";

type AdminSchedulePrepPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSchedulePrepPage({ params }: AdminSchedulePrepPageProps) {
  const { id } = await params;
  const schedulePrepResult = await getSchedulePrep(id);

  if (!schedulePrepResult.ok) {
    return <ErrorScreen />;
  }

  if (schedulePrepResult.data === null) {
    return <NotFoundScreen />;
  }

  return (
    <AdminSchedulePrepView
      schedulePrep={schedulePrepResult.data}
      onReplaceCeremonies={replaceCeremonies}
      onSetPlannedTimes={setPlannedTimes}
      onCreateCheckInRule={createCheckInRule}
      onUpdateCheckInRule={updateCheckInRule}
      onDeleteCheckInRule={deleteCheckInRule}
    />
  );
}
