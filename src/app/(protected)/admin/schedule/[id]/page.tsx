import { listPositions } from "@/entities/position/api/list-positions";
import { ensureScheduleRequirementsCopied } from "@/entities/schedule/api/ensure-schedule-requirements-copied";
import { getSchedulePrep } from "@/entities/schedule/api/get-schedule-prep";
import { listScheduleRequirements } from "@/entities/schedule/api/list-schedule-requirements";
import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";
import { replaceCeremonies } from "@/features/ceremony/api/replace-ceremonies";
import { setPlannedTimes } from "@/features/ceremony/api/set-planned-times";
import {
  createCheckInRule,
  deleteCheckInRule,
  updateCheckInRule,
} from "@/features/ceremony/api/manage-checkin-rules";
import { removeRequirement } from "@/features/requirement/api/remove-requirement";
import { setRequirement } from "@/features/requirement/api/set-requirement";
import { AdminSchedulePrepView } from "@/views/admin-schedule/ui/AdminSchedulePrepView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";
import { NotFoundScreen } from "@/views/status/ui/NotFoundScreen";

const NON_COPYABLE_STATUSES: RecruitmentScheduleStatus[] = ["CANCELLED"];

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

  if (!NON_COPYABLE_STATUSES.includes(schedulePrepResult.data.status)) {
    await ensureScheduleRequirementsCopied(id);
  }

  const [requirementsResult, positionsResult] = await Promise.all([
    listScheduleRequirements(id),
    listPositions(),
  ]);

  const requirementRows = requirementsResult.ok ? requirementsResult.data : [];
  const activePositions = positionsResult.ok
    ? positionsResult.data.filter((position) => position.isActive)
    : [];

  return (
    <AdminSchedulePrepView
      schedulePrep={schedulePrepResult.data}
      onReplaceCeremonies={replaceCeremonies}
      onSetPlannedTimes={setPlannedTimes}
      onCreateCheckInRule={createCheckInRule}
      onUpdateCheckInRule={updateCheckInRule}
      onDeleteCheckInRule={deleteCheckInRule}
      requirementRows={requirementRows}
      activePositions={activePositions}
      onSetRequirement={setRequirement}
      onRemoveRequirement={removeRequirement}
    />
  );
}
