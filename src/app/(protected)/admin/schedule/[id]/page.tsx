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
import { resolveRequirementSectionData } from "@/views/admin-schedule/model/requirement-section-data";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";
import { NotFoundScreen } from "@/views/status/ui/NotFoundScreen";

const NON_COPYABLE_STATUSES: RecruitmentScheduleStatus[] = ["CONFIRMED", "CANCELLED"];

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

  const requirementSectionData = resolveRequirementSectionData({
    requirementsOk: requirementsResult.ok,
    requirementRows: requirementsResult.ok ? requirementsResult.data : [],
    positionsOk: positionsResult.ok,
    positions: positionsResult.ok ? positionsResult.data : [],
  });

  if (!requirementSectionData.ok) {
    return <ErrorScreen />;
  }

  return (
    <AdminSchedulePrepView
      schedulePrep={schedulePrepResult.data}
      onReplaceCeremonies={replaceCeremonies}
      onSetPlannedTimes={setPlannedTimes}
      onCreateCheckInRule={createCheckInRule}
      onUpdateCheckInRule={updateCheckInRule}
      onDeleteCheckInRule={deleteCheckInRule}
      requirementRows={requirementSectionData.requirementRows}
      activePositions={requirementSectionData.activePositions}
      onSetRequirement={setRequirement}
      onRemoveRequirement={removeRequirement}
    />
  );
}
