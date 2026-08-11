import { listPositions } from "@/entities/position/api/list-positions";
import { countScheduleRequirements } from "@/entities/schedule/api/count-schedule-requirements";
import { ensureScheduleRequirementsCopied } from "@/entities/schedule/api/ensure-schedule-requirements-copied";
import { getSchedulePrep } from "@/entities/schedule/api/get-schedule-prep";
import { listScheduleRequirements } from "@/entities/schedule/api/list-schedule-requirements";
import { listAssignmentCandidates } from "@/features/assignment/api/list-assignment-candidates";
import { replacePositionAssignments } from "@/features/assignment/api/replace-position-assignments";
import { replaceCeremonies } from "@/features/ceremony/api/replace-ceremonies";
import { setPlannedTimes } from "@/features/ceremony/api/set-planned-times";
import {
  createCheckInRule,
  deleteCheckInRule,
  updateCheckInRule,
} from "@/features/ceremony/api/manage-checkin-rules";
import { removeRequirement } from "@/features/requirement/api/remove-requirement";
import { setRequirement } from "@/features/requirement/api/set-requirement";
import { RouteTransition } from "@/shared/ui/route-transition";
import { AdminSchedulePrepView } from "@/views/admin-schedule/ui/AdminSchedulePrepView";
import {
  resolveRequirementSectionData,
  shouldCopyScheduleRequirements,
} from "@/views/admin-schedule/model/requirement-section-data";
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

  const [requirementCountResult, positionsResult] = await Promise.all([
    countScheduleRequirements(id),
    listPositions(),
  ]);

  if (
    requirementCountResult.ok &&
    shouldCopyScheduleRequirements({
      status: schedulePrepResult.data.status,
      existingRequirementRowCount: requirementCountResult.count,
    })
  ) {
    const copyResult = await ensureScheduleRequirementsCopied(id);

    if (!copyResult.ok) {
      return <ErrorScreen />;
    }
  }

  const requirementsResult = await listScheduleRequirements(id);

  const requirementSectionData = resolveRequirementSectionData({
    requirementsOk: requirementsResult.ok,
    requirementRows: requirementsResult.ok ? requirementsResult.data : [],
    assignedCounts: requirementsResult.ok ? requirementsResult.assignedCounts : {},
    positionsOk: positionsResult.ok,
    positions: positionsResult.ok ? positionsResult.data : [],
  });

  if (!requirementSectionData.ok) {
    return <ErrorScreen />;
  }

  return (
    <RouteTransition>
      <AdminSchedulePrepView
        schedulePrep={schedulePrepResult.data}
        onReplaceCeremonies={replaceCeremonies}
        onSetPlannedTimes={setPlannedTimes}
        onCreateCheckInRule={createCheckInRule}
        onUpdateCheckInRule={updateCheckInRule}
        onDeleteCheckInRule={deleteCheckInRule}
        requirementRows={requirementSectionData.requirementRows}
        assignedCounts={requirementSectionData.assignedCounts}
        activePositions={requirementSectionData.activePositions}
        onSetRequirement={setRequirement}
        onRemoveRequirement={removeRequirement}
        onListCandidates={listAssignmentCandidates}
        onReplaceAssignments={replacePositionAssignments}
      />
    </RouteTransition>
  );
}
