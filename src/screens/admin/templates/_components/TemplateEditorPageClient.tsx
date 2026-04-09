"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import type { Position } from "#/entities/positions/models/schemas/position";
import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import {
  createDefaultTemplateFormValues,
  createPositionDefaultRequiredCountMap,
  createPositionNameMap,
  createTemplateFormValuesFromTemplate,
  createTemplatePositionOptions,
} from "#/screens/admin/templates/_helpers/templateForm";
import { useTemplateEditorFormState } from "#/screens/admin/templates/_hooks/useTemplateEditorFormState";
import { EventTemplateEditorCard } from "#/screens/admin/templates/_components/EventTemplateEditorCard";

type TemplateEditorPageClientProps = {
  initialTemplate: EventTemplate | null;
  positions: Position[];
  templatesCount: number;
};

export function TemplateEditorPageClient({
  initialTemplate,
  positions,
  templatesCount,
}: Readonly<TemplateEditorPageClientProps>) {
  const router = useRouter();
  const defaultPositionId = positions[0]?.id ?? "";
  const defaultRequiredCount = positions[0]?.defaultRequiredCount ?? 2;
  const positionIds = useMemo(
    () => positions.map((position) => position.id),
    [positions]
  );
  const defaultRequiredCountByPositionId = useMemo(
    () => createPositionDefaultRequiredCountMap(positions),
    [positions]
  );
  const positionNameById = useMemo(
    () => createPositionNameMap(positions),
    [positions]
  );
  const positionOptions = useMemo(
    () => createTemplatePositionOptions(positions),
    [positions]
  );
  const defaultTemplateValues = useMemo(
    () =>
      initialTemplate
        ? createTemplateFormValuesFromTemplate(initialTemplate)
        : createDefaultTemplateFormValues(
            positions,
            defaultPositionId,
            defaultRequiredCount,
            templatesCount === 0
          ),
    [
      defaultPositionId,
      defaultRequiredCount,
      initialTemplate,
      positions,
      templatesCount,
    ]
  );
  const {
    addSlotRow,
    cancelBelowDefaultRequiredCount,
    clearSlotDragState,
    confirmBelowDefaultRequiredCount,
    draggingSlotKey,
    dropOnSlot,
    dropTargetSlotKey,
    form,
    isPrimaryLocked,
    isSaving,
    pendingBelowDefaultRequiredCount,
    removeSlotRow,
    serverError,
    setSlotDropTarget,
    slotFields,
    startSlotDrag,
    submit,
    updateField,
    updatePrimary,
    updateSlot,
  } = useTemplateEditorFormState({
    defaultPositionId,
    defaultRequiredCount,
    defaultRequiredCountByPositionId,
    defaultTemplateValues,
    initialTemplate,
    onSubmitted(templateId) {
      router.push(`/admin/templates?highlight=${templateId}`);
    },
    positionIds,
    positionNameById,
    templatesCount,
  });

  return (
    <>
      <EventTemplateEditorCard
        canManageSlots={positionOptions.length > 0}
        defaultPositionId={defaultPositionId}
        defaultRequiredCount={defaultRequiredCount}
        defaultRequiredCountByPositionId={defaultRequiredCountByPositionId}
        draggingSlotKey={draggingSlotKey}
        dropTargetSlotKey={dropTargetSlotKey}
        editingTemplateId={initialTemplate?.id ?? null}
        form={form}
        isPrimaryLocked={isPrimaryLocked}
        isSaving={isSaving}
        onAddSlotRow={addSlotRow}
        onCancel={() => router.push("/admin/templates")}
        onFieldChange={updateField}
        onPrimaryChange={updatePrimary}
        onRemoveSlotRow={removeSlotRow}
        onSlotDragEnd={clearSlotDragState}
        onSlotDragStart={startSlotDrag}
        onSlotDrop={dropOnSlot}
        onSlotDropTargetChange={setSlotDropTarget}
        onSubmit={submit}
        onUpdateSlot={updateSlot}
        positionOptions={positionOptions}
        serverError={serverError}
        slotFields={slotFields}
      />

      <ConfirmDialog
        confirmLabel="계속 진행"
        description={
          pendingBelowDefaultRequiredCount
            ? `${pendingBelowDefaultRequiredCount.positionName}의 기본 필수 인원은 ${pendingBelowDefaultRequiredCount.positionDefaultRequiredCount}명입니다. ${pendingBelowDefaultRequiredCount.nextRequiredCount}명으로 낮추면 이 템플릿에만 별도 값이 적용됩니다. 계속할까요?`
            : "기본 필수 인원보다 낮게 설정하면 이 템플릿에만 별도 값이 저장됩니다."
        }
        onConfirm={confirmBelowDefaultRequiredCount}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            cancelBelowDefaultRequiredCount();
          }
        }}
        open={pendingBelowDefaultRequiredCount !== null}
        title="기본 필수 인원보다 낮게 설정합니다"
      />
    </>
  );
}
