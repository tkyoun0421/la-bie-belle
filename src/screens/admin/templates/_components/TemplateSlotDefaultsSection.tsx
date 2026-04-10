import { useFormState, useWatch, type FieldArrayWithId, type UseFormReturn } from "react-hook-form";
import Link from "next/link";
import { Button } from "#/shared/components/ui/button";
import { FormFieldError } from "#/shared/components/common/FormFieldError";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";
import type {
  TemplateFormSlot,
  TemplatePositionOption,
} from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateSlotDefaultRow } from "#/screens/admin/templates/_components/TemplateSlotDefaultRow";

type TemplateSlotDefaultsSectionProps = {
  canManageSlots: boolean;
  draggingSlotKey: string | null;
  dropTargetSlotKey: string | null;
  form: UseFormReturn<CreateEventTemplateInput>;
  onAddSlotRow: () => void;
  onRemoveSlotRow: (slotIndex: number) => void;
  onSlotDragEnd: () => void;
  onSlotDragStart: (slotKey: string) => void;
  onSlotDrop: (slotKey: string) => void;
  onSlotDropTargetChange: (slotKey: string) => void;
  onUpdateSlot: (
    slotIndex: number,
    field: keyof TemplateFormSlot,
    nextValue: string
  ) => void;
  positionOptions: TemplatePositionOption[];
  slotFields: FieldArrayWithId<
    CreateEventTemplateInput,
    "slotDefaults",
    "_key"
  >[];
};

export function TemplateSlotDefaultsSection({
  canManageSlots,
  draggingSlotKey,
  dropTargetSlotKey,
  form,
  onAddSlotRow,
  onRemoveSlotRow,
  onSlotDragEnd,
  onSlotDragStart,
  onSlotDrop,
  onSlotDropTargetChange,
  onUpdateSlot,
  positionOptions,
  slotFields,
}: Readonly<TemplateSlotDefaultsSectionProps>) {
  const watchedPositionIds = useWatch({
    control: form.control,
    name: slotFields.map(
      (_, index) => `slotDefaults.${index}.positionId` as const
    ),
  });
  const { errors } = useFormState({
    control: form.control,
    exact: true,
    name: "slotDefaults",
  });
  const selectedPositionIds = (watchedPositionIds ?? []).filter(
    (positionId): positionId is string => Boolean(positionId)
  );
  const sectionError = readFieldArrayErrorMessage(errors.slotDefaults);
  const canAddSlot = canManageSlots && slotFields.length < positionOptions.length;
  const canReorderSlots = slotFields.length > 1;
  const draggingSlotIndex = draggingSlotKey
    ? slotFields.findIndex((slot) => slot._key === draggingSlotKey)
    : -1;
  const dropTargetSlotIndex = dropTargetSlotKey
    ? slotFields.findIndex((slot) => slot._key === dropTargetSlotKey)
    : -1;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            포지션 기본값
          </h3>
          <p className="text-sm text-[var(--text-subtle)]">
            생성 시 그대로 복사되는 템플릿용 기본 포지션 구성을 설정합니다.
          </p>
          <FormFieldError className="mt-2" message={sectionError} />
        </div>
        <Button
          disabled={!canAddSlot}
          onClick={onAddSlotRow}
          type="button"
          variant="outline"
        >
          포지션 추가
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-[var(--text-muted)]">
          {canReorderSlots
            ? "왼쪽 핸들을 잡고 드래그해 포지션 순서를 바꿔 보세요."
            : "포지션이 2개 이상일 때 순서를 바꿀 수 있습니다."}
        </p>
        <Link
          className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
          href="/admin/positions"
        >
          포지션 관리 화면으로 가기
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)]">
        {slotFields.map((slotField, index) => (
          <TemplateSlotDefaultRow
            canReorderSlots={canReorderSlots}
            draggingSlotIndex={draggingSlotIndex}
            draggingSlotKey={draggingSlotKey}
            dropTargetSlotIndex={dropTargetSlotIndex}
            dropTargetSlotKey={dropTargetSlotKey}
            fieldKey={slotField._key}
            form={form}
            key={slotField._key}
            onRemoveSlotRow={onRemoveSlotRow}
            onSlotDragEnd={onSlotDragEnd}
            onSlotDragStart={onSlotDragStart}
            onSlotDrop={onSlotDrop}
            onSlotDropTargetChange={onSlotDropTargetChange}
            onUpdateSlot={onUpdateSlot}
            positionOptions={positionOptions}
            selectedPositionIds={selectedPositionIds}
            slotIndex={index}
          />
        ))}
      </div>
    </div>
  );
}

function readFieldArrayErrorMessage(slotDefaultErrors: unknown) {
  if (!slotDefaultErrors || Array.isArray(slotDefaultErrors)) {
    return readRootFieldErrorMessage(slotDefaultErrors);
  }

  if (
    typeof slotDefaultErrors === "object" &&
    "message" in slotDefaultErrors &&
    typeof slotDefaultErrors.message === "string"
  ) {
    return slotDefaultErrors.message;
  }

  return null;
}

function readRootFieldErrorMessage(slotDefaultErrors: unknown) {
  if (
    slotDefaultErrors &&
    typeof slotDefaultErrors === "object" &&
    "root" in slotDefaultErrors
  ) {
    const root = slotDefaultErrors.root;

    if (root && typeof root === "object" && "message" in root) {
      return typeof root.message === "string" ? root.message : null;
    }
  }

  return null;
}
