import { useFormState, useWatch, type UseFormReturn } from "react-hook-form";
import { GripVertical } from "lucide-react";
import { ReorderDropIndicator } from "#/shared/components/drag-and-drop/ReorderDropIndicator";
import { FormFieldError } from "#/shared/components/common/FormFieldError";
import { Button } from "#/shared/components/ui/button";
import { Input } from "#/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/shared/components/ui/select";
import { getReorderDropIndicatorPosition } from "#/shared/lib/drag-and-drop/getReorderDropIndicatorPosition";
import { setDragPreview } from "#/shared/lib/drag-and-drop/setDragPreview";
import { cn } from "#/shared/lib/utils";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";
import type {
  TemplateFormSlot,
  TemplatePositionOption,
} from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateField } from "#/screens/admin/templates/_components/TemplateField";

type TemplateSlotDefaultRowProps = {
  canReorderSlots: boolean;
  draggingSlotIndex: number;
  draggingSlotKey: string | null;
  dropTargetSlotIndex: number;
  dropTargetSlotKey: string | null;
  fieldKey: string;
  form: UseFormReturn<CreateEventTemplateInput>;
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
  selectedPositionIds: string[];
  slotIndex: number;
};

export function TemplateSlotDefaultRow({
  canReorderSlots,
  draggingSlotIndex,
  draggingSlotKey,
  dropTargetSlotIndex,
  dropTargetSlotKey,
  fieldKey,
  form,
  onRemoveSlotRow,
  onSlotDragEnd,
  onSlotDragStart,
  onSlotDrop,
  onSlotDropTargetChange,
  onUpdateSlot,
  positionOptions,
  selectedPositionIds,
  slotIndex,
}: Readonly<TemplateSlotDefaultRowProps>) {
  const slot = useWatch({
    control: form.control,
    name: `slotDefaults.${slotIndex}` as const,
  });
  const { errors } = useFormState({
    control: form.control,
    name: [
      `slotDefaults.${slotIndex}.positionId` as const,
      `slotDefaults.${slotIndex}.requiredCount` as const,
    ],
  });
  const positionIdError = readFieldErrorMessage(errors.slotDefaults?.[slotIndex]?.positionId);
  const requiredCountError = readFieldErrorMessage(
    errors.slotDefaults?.[slotIndex]?.requiredCount
  );
  const isDragging = draggingSlotKey === fieldKey;
  const isDropTarget = dropTargetSlotKey === fieldKey;
  const showRowAccent = !isDropTarget && slotIndex % 2 === 0;
  const dropIndicatorPosition = isDropTarget
    ? getReorderDropIndicatorPosition(draggingSlotIndex, dropTargetSlotIndex)
    : null;
  const hasDesktopRowError = Boolean(positionIdError || requiredCountError);

  return (
    <div
      className={cn(
        "relative border-t border-[var(--border-soft)] first:border-t-0",
        "transition-opacity transition-transform",
        isDropTarget && "z-[1] bg-[#f5faff] ring-2 ring-inset ring-[#9ac2ff]",
        isDragging && "scale-[0.99] opacity-45"
      )}
      data-drag-preview
      onDragOver={(event) => {
        if (!canReorderSlots) {
          return;
        }

        event.preventDefault();
        onSlotDropTargetChange(fieldKey);
      }}
      onDrop={(event) => {
        if (!canReorderSlots) {
          return;
        }

        event.preventDefault();
        onSlotDrop(fieldKey);
      }}
    >
      {showRowAccent ? (
        <div
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full bg-[rgba(15,23,42,0.12)]"
        />
      ) : null}

      {dropIndicatorPosition ? (
        <ReorderDropIndicator position={dropIndicatorPosition} />
      ) : null}

      <div className="grid gap-3 p-4 md:grid-cols-[40px_minmax(0,1.4fr)_160px_auto]">
        <div className="flex items-end">
          <button
            aria-label="포지션 순서 이동"
            className="inline-flex size-8 cursor-grab items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canReorderSlots}
            draggable={canReorderSlots}
            onDragEnd={onSlotDragEnd}
            onDragStart={(event) => {
              if (!canReorderSlots) {
                return;
              }

              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", fieldKey);
              setDragPreview(event);
              onSlotDragStart(fieldKey);
            }}
            type="button"
          >
            <GripVertical className="size-4" />
          </button>
        </div>

        <TemplateField
          error={positionIdError}
          errorClassName="md:hidden"
          label="포지션"
        >
          <Select
            onValueChange={(value) => onUpdateSlot(slotIndex, "positionId", value)}
            value={slot?.positionId ?? ""}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="포지션 선택" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((position) => {
                const isTakenByOtherSlot =
                  position.value !== slot?.positionId &&
                  selectedPositionIds.includes(position.value);

                return (
                  <SelectItem
                    disabled={isTakenByOtherSlot}
                    key={position.value}
                    value={position.value}
                  >
                    {position.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </TemplateField>

        <TemplateField
          error={requiredCountError}
          errorClassName="md:hidden"
          label="필수 인원"
        >
          <Input
            min="1"
            onChange={(event) =>
              onUpdateSlot(slotIndex, "requiredCount", event.target.value)
            }
            type="number"
            value={slot?.requiredCount ?? 1}
          />
        </TemplateField>

        <div className="flex items-end">
          <Button
            className="text-[var(--foreground)]"
            onClick={() => onRemoveSlotRow(slotIndex)}
            type="button"
            variant="outline"
          >
            제거
          </Button>
        </div>
      </div>

      {hasDesktopRowError ? (
        <div className="hidden px-4 pb-4 md:grid md:grid-cols-[40px_minmax(0,1.4fr)_160px_auto] md:gap-3">
          <div />
          <FormFieldError message={positionIdError} />
          <FormFieldError message={requiredCountError} />
          <div />
        </div>
      ) : null}
    </div>
  );
}

function readFieldErrorMessage(message: unknown) {
  return typeof message === "string" ? message : null;
}
