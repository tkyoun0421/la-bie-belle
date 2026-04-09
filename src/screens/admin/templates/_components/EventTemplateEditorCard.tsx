import { Alert, AlertDescription } from "#/shared/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";
import { TemplateBasicsFields } from "#/screens/admin/templates/_components/TemplateBasicsFields";
import { TemplateEditorActions } from "#/screens/admin/templates/_components/TemplateEditorActions";
import { TemplateSlotDefaultsSection } from "#/screens/admin/templates/_components/TemplateSlotDefaultsSection";
import type {
  TemplateFieldName,
  TemplateFormState,
  TemplatePositionOption,
  TemplateSlotRow,
} from "#/screens/admin/templates/_helpers/templateForm";

type TemplateFormSlot = CreateEventTemplateInput["slotDefaults"][number];

type EventTemplateEditorCardProps = {
  canManageSlots: boolean;
  draggingSlotKey: string | null;
  dropTargetSlotKey: string | null;
  editingTemplateId: string | null;
  error: string | null;
  formState: TemplateFormState;
  isPrimaryLocked: boolean;
  isSaving: boolean;
  onAddSlotRow: () => void;
  onCancel: () => void;
  onFieldChange: (field: TemplateFieldName, value: string) => void;
  onPrimaryChange: (nextValue: boolean) => void;
  onRemoveSlotRow: (slotIndex: number) => void;
  onSlotDragEnd: () => void;
  onSlotDragStart: (slotKey: string) => void;
  onSlotDrop: (slotKey: string) => void;
  onSlotDropTargetChange: (slotKey: string) => void;
  onSubmit: () => void;
  onUpdateSlot: (
    slotIndex: number,
    field: keyof TemplateFormSlot,
    nextValue: string
  ) => void;
  positionOptions: TemplatePositionOption[];
  slotRows: TemplateSlotRow[];
};

export function EventTemplateEditorCard({
  canManageSlots,
  draggingSlotKey,
  dropTargetSlotKey,
  editingTemplateId,
  error,
  formState,
  isPrimaryLocked,
  isSaving,
  onAddSlotRow,
  onCancel,
  onFieldChange,
  onPrimaryChange,
  onRemoveSlotRow,
  onSlotDragEnd,
  onSlotDragStart,
  onSlotDrop,
  onSlotDropTargetChange,
  onSubmit,
  onUpdateSlot,
  positionOptions,
  slotRows,
}: Readonly<EventTemplateEditorCardProps>) {
  return (
    <Card className="bg-white shadow-xl">
      <CardHeader>
        <CardTitle>
          {editingTemplateId ? "템플릿 수정" : "새 템플릿 만들기"}
        </CardTitle>
        <CardDescription>
          템플릿 이름과 서비스 시간, 포지션 기본 구성을 저장합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <TemplateBasicsFields
            formState={formState}
            isPrimaryLocked={isPrimaryLocked}
            onFieldChange={onFieldChange}
            onPrimaryChange={onPrimaryChange}
          />

          <TemplateSlotDefaultsSection
            canManageSlots={canManageSlots}
            draggingSlotKey={draggingSlotKey}
            dropTargetSlotKey={dropTargetSlotKey}
            onAddSlotRow={onAddSlotRow}
            onRemoveSlotRow={onRemoveSlotRow}
            onSlotDragEnd={onSlotDragEnd}
            onSlotDragStart={onSlotDragStart}
            onSlotDrop={onSlotDrop}
            onSlotDropTargetChange={onSlotDropTargetChange}
            onUpdateSlot={onUpdateSlot}
            positionOptions={positionOptions}
            slotRows={slotRows}
          />

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <TemplateEditorActions
            canManageSlots={canManageSlots}
            editingTemplateId={editingTemplateId}
            isSaving={isSaving}
            onCancel={onCancel}
          />
        </form>
      </CardContent>
    </Card>
  );
}
