import Link from "next/link";
import { GripVertical } from "lucide-react";
import { FormFieldError } from "#/shared/components/common/FormFieldError";
import { ReorderDropIndicator } from "#/shared/components/drag-and-drop/ReorderDropIndicator";
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
import type {
  TemplateFormSlot,
  TemplatePositionOption,
  TemplateSlotFieldErrors,
  TemplateSlotRow,
} from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateField } from "#/screens/admin/templates/_components/TemplateField";

type TemplateSlotDefaultsSectionProps = {
  canManageSlots: boolean;
  draggingSlotKey: string | null;
  dropTargetSlotKey: string | null;
  error: string | null;
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
  slotErrors: TemplateSlotFieldErrors[];
  slotRows: TemplateSlotRow[];
};

export function TemplateSlotDefaultsSection({
  canManageSlots,
  draggingSlotKey,
  dropTargetSlotKey,
  error,
  onAddSlotRow,
  onRemoveSlotRow,
  onSlotDragEnd,
  onSlotDragStart,
  onSlotDrop,
  onSlotDropTargetChange,
  onUpdateSlot,
  positionOptions,
  slotErrors,
  slotRows,
}: Readonly<TemplateSlotDefaultsSectionProps>) {
  const selectedPositionIds = new Set(
    slotRows.map((slot) => slot.positionId).filter(Boolean)
  );
  const canAddSlot = canManageSlots && slotRows.length < positionOptions.length;
  const canReorderSlots = slotRows.length > 1;
  const draggingSlotIndex = draggingSlotKey
    ? slotRows.findIndex((slot) => slot._key === draggingSlotKey)
    : -1;
  const dropTargetSlotIndex = dropTargetSlotKey
    ? slotRows.findIndex((slot) => slot._key === dropTargetSlotKey)
    : -1;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            포지션 기본값
          </h3>
          <p className="text-sm text-[var(--text-subtle)]">
            생성 시 그대로 복사되는 템플릿용 기본 포지션 구성입니다.
          </p>
          <FormFieldError className="mt-2" message={error} />
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
        {slotRows.map((slot, index) => {
          const isDragging = draggingSlotKey === slot._key;
          const isDropTarget = dropTargetSlotKey === slot._key;
          const showRowAccent = !isDropTarget && index % 2 === 0;
          const dropIndicatorPosition = isDropTarget
            ? getReorderDropIndicatorPosition(
                draggingSlotIndex,
                dropTargetSlotIndex
              )
            : null;

          return (
            <div
              className={cn(
                "relative grid gap-3 border-t border-[var(--border-soft)] p-4 first:border-t-0 md:grid-cols-[40px_minmax(0,1.4fr)_160px_auto]",
                "transition-opacity transition-transform",
                isDropTarget &&
                  "z-[1] bg-[#f5faff] ring-2 ring-inset ring-[#9ac2ff]",
                isDragging && "scale-[0.99] opacity-45"
              )}
              data-drag-preview
              key={slot._key}
              onDragOver={(event) => {
                if (!canReorderSlots) {
                  return;
                }

                event.preventDefault();
                onSlotDropTargetChange(slot._key);
              }}
              onDrop={(event) => {
                if (!canReorderSlots) {
                  return;
                }

                event.preventDefault();
                onSlotDrop(slot._key);
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

              <div className="flex items-end">
                <button
                  aria-label="슬롯 순서 이동"
                  className="inline-flex size-8 cursor-grab items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canReorderSlots}
                  draggable={canReorderSlots}
                  onDragEnd={onSlotDragEnd}
                  onDragStart={(event) => {
                    if (!canReorderSlots) {
                      return;
                    }

                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", slot._key);
                    setDragPreview(event);
                    onSlotDragStart(slot._key);
                  }}
                  type="button"
                >
                  <GripVertical className="size-4" />
                </button>
              </div>

              <TemplateField
                error={slotErrors[index]?.positionId}
                label="포지션"
              >
                <Select
                  onValueChange={(value) =>
                    onUpdateSlot(index, "positionId", value)
                  }
                  value={slot.positionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="포지션 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((position) => {
                      const isTakenByOtherSlot =
                        position.value !== slot.positionId &&
                        selectedPositionIds.has(position.value);

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
                error={slotErrors[index]?.requiredCount}
                label="필수 인원"
              >
                <Input
                  min="1"
                  onChange={(event) =>
                    onUpdateSlot(index, "requiredCount", event.target.value)
                  }
                  type="number"
                  value={slot.requiredCount}
                />
              </TemplateField>

              <div className="flex items-end">
                <Button
                  className="text-[var(--foreground)]"
                  onClick={() => onRemoveSlotRow(index)}
                  type="button"
                  variant="outline"
                >
                  제거
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
