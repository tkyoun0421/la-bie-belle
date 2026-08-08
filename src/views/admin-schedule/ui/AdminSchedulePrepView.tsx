"use client";

import type { SchedulePrep } from "@/entities/schedule/types/schedule-prep";
import {
  useCeremonyEditor,
  type ReplaceCeremoniesAction,
  type SetPlannedTimesAction,
} from "@/features/ceremony/hooks/useCeremonyEditor";
import {
  useCheckInRuleActions,
  type CheckInRuleActionInput,
  type CheckInRuleMutationOutcome,
  type DeleteCheckInRuleActionInput,
} from "@/features/ceremony/hooks/useCheckInRuleActions";
import { CeremonyGenerateForm } from "@/features/ceremony/ui/CeremonyGenerateForm";
import { CeremonyListEditor } from "@/features/ceremony/ui/CeremonyListEditor";
import { CheckInRuleEditor } from "@/features/ceremony/ui/CheckInRuleEditor";
import { PlannedTimesEditor } from "@/features/ceremony/ui/PlannedTimesEditor";
import { RecommendationConfirmDialog } from "@/features/ceremony/ui/RecommendationConfirmDialog";
import {
  resolveSchedulePrepScreenMode,
  schedulePrepStatusLabel,
} from "@/views/admin-schedule/model/schedule-prep-screen";

const READONLY_NOTICE = "확정되었거나 취소된 스케줄은 예식·예정 시각을 수정할 수 없어요";
const EMPTY_CEREMONY_MESSAGE = "아직 등록된 예식이 없어요. 개수와 첫 예식 시각으로 생성해 주세요";

type AdminSchedulePrepViewProps = {
  schedulePrep: SchedulePrep;
  onReplaceCeremonies: ReplaceCeremoniesAction;
  onSetPlannedTimes: SetPlannedTimesAction;
  onCreateCheckInRule: (input: CheckInRuleActionInput) => Promise<CheckInRuleMutationOutcome>;
  onUpdateCheckInRule: (input: CheckInRuleActionInput) => Promise<CheckInRuleMutationOutcome>;
  onDeleteCheckInRule: (input: DeleteCheckInRuleActionInput) => Promise<CheckInRuleMutationOutcome>;
};

export function AdminSchedulePrepView({
  schedulePrep,
  onReplaceCeremonies,
  onSetPlannedTimes,
  onCreateCheckInRule,
  onUpdateCheckInRule,
  onDeleteCheckInRule,
}: AdminSchedulePrepViewProps) {
  const editor = useCeremonyEditor(
    {
      scheduleId: schedulePrep.id,
      ceremonyTimes: schedulePrep.ceremonyTimes,
      plannedCheckin: schedulePrep.plannedCheckin,
      plannedCheckout: schedulePrep.plannedCheckout,
      checkInRules: schedulePrep.checkInRules,
    },
    onReplaceCeremonies,
    onSetPlannedTimes,
  );
  const ruleActions = useCheckInRuleActions(
    onCreateCheckInRule,
    onUpdateCheckInRule,
    onDeleteCheckInRule,
  );

  const mode = resolveSchedulePrepScreenMode({
    status: schedulePrep.status,
    ceremonyTimes: editor.ceremonyTimes,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="typo-display text-text-strong">{schedulePrep.workDate}</h1>
        <p className="typo-body text-text">{schedulePrepStatusLabel(schedulePrep.status)}</p>
      </div>

      {mode === "readonly" ? (
        <section className="flex flex-col gap-3">
          <p className="typo-body text-text">{READONLY_NOTICE}</p>
          <ul className="flex flex-col gap-1">
            {editor.ceremonyTimes.map((time, index) => (
              <li key={index} className="typo-body text-text-strong">
                {time}
              </li>
            ))}
          </ul>
          <p className="typo-body text-text">
            예정 출근 {schedulePrep.plannedCheckin ?? "미설정"} · 예정 퇴근{" "}
            {schedulePrep.plannedCheckout ?? "미설정"}
          </p>
        </section>
      ) : null}

      {mode === "empty" ? (
        <section className="flex flex-col gap-3">
          <p className="typo-body text-text">{EMPTY_CEREMONY_MESSAGE}</p>
          <CeremonyGenerateForm onGenerate={editor.generateFromCount} />
        </section>
      ) : null}

      {mode === "editing" ? (
        <>
          <CeremonyListEditor
            ceremonyTimes={editor.ceremonyTimes}
            onUpdateTime={editor.updateCeremonyTime}
            onAddTime={() => editor.addCeremonyTime("")}
            onRemoveTime={editor.removeCeremonyTime}
            onSave={editor.saveCeremonies}
            saving={editor.saving}
          />
          <PlannedTimesEditor
            plannedCheckin={editor.plannedCheckin}
            plannedCheckout={editor.plannedCheckout}
            onSave={editor.savePlannedTimesManually}
            saving={editor.saving}
          />
          <RecommendationConfirmDialog
            recommendation={editor.pendingRecommendation}
            currentCheckin={editor.plannedCheckin}
            currentCheckout={editor.plannedCheckout}
            onConfirm={editor.confirmRecommendation}
            onDismiss={editor.dismissRecommendation}
          />
        </>
      ) : null}

      <CheckInRuleEditor
        rules={schedulePrep.checkInRules}
        onCreate={ruleActions.create}
        onUpdate={ruleActions.update}
        onDelete={ruleActions.remove}
        pending={ruleActions.pending}
      />
    </main>
  );
}
