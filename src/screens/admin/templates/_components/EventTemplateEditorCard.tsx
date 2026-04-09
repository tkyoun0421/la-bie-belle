import { Alert, AlertDescription } from "#/shared/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";
import type {
  TemplateFieldName,
  TemplateFormState,
  TemplatePositionOption,
  TemplateSlotRow,
} from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateBasicsFields } from "#/screens/admin/templates/_components/TemplateBasicsFields";
import { TemplateEditorActions } from "#/screens/admin/templates/_components/TemplateEditorActions";
import { TemplateSlotDefaultsSection } from "#/screens/admin/templates/_components/TemplateSlotDefaultsSection";

type TemplateFormSlot = CreateEventTemplateInput["slotDefaults"][number];

type EventTemplateEditorCardProps = {
  canManageSlots: boolean;
  editingTemplateId: string | null;
  error: string | null;
  formState: TemplateFormState;
  isSaving: boolean;
  onAddSlotRow: () => void;
  onCancel: () => void;
  onFieldChange: (field: TemplateFieldName, value: string) => void;
  onRemoveSlotRow: (slotIndex: number) => void;
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
  editingTemplateId,
  error,
  formState,
  isSaving,
  onAddSlotRow,
  onCancel,
  onFieldChange,
  onRemoveSlotRow,
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
          템플릿 이름과 기본 서비스 시간, 포지션별 기본 인원을 저장합니다.
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
            onFieldChange={onFieldChange}
          />

          <TemplateSlotDefaultsSection
            canManageSlots={canManageSlots}
            onAddSlotRow={onAddSlotRow}
            onRemoveSlotRow={onRemoveSlotRow}
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
