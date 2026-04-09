import { startTransition, useState } from "react";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useCreateEventTemplateMutation } from "#/mutations/events/hooks/useCreateEventTemplateMutation";
import { useDeleteEventTemplateMutation } from "#/mutations/events/hooks/useDeleteEventTemplateMutation";
import { useUpdateEventTemplateMutation } from "#/mutations/events/hooks/useUpdateEventTemplateMutation";
import type { CreateEventTemplateInput } from "#/mutations/events/models/schemas/createEventTemplate";

type TemplateFormSlot = CreateEventTemplateInput["slotDefaults"][number];

type TemplateFormState = {
  firstServiceAt: string;
  lastServiceEndAt: string;
  name: string;
  slotDefaults: TemplateFormSlot[];
};

type UseEventTemplateEditorStateOptions = {
  defaultPositionId: string;
  onDeleted?: (deletedTemplateId: string) => void;
  onSaved?: (template: EventTemplate) => void;
};

export function useEventTemplateEditorState({
  defaultPositionId,
  onDeleted,
  onSaved,
}: UseEventTemplateEditorStateOptions) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState(() =>
    createDefaultFormState(defaultPositionId)
  );
  const createTemplateMutation = useCreateEventTemplateMutation();
  const updateTemplateMutation = useUpdateEventTemplateMutation();
  const deleteTemplateMutation = useDeleteEventTemplateMutation();
  const isSaving =
    createTemplateMutation.isPending || updateTemplateMutation.isPending;

  async function submit() {
    setFormError(null);

    try {
      const template = editingTemplateId
        ? await updateTemplateMutation.mutateAsync({
            id: editingTemplateId,
            ...formState,
          })
        : await createTemplateMutation.mutateAsync(formState);

      startTransition(() => {
        resetForm(defaultPositionId);
        onSaved?.(template);
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "행사 템플릿을 저장하지 못했습니다."
      );
    }
  }

  function updateField(
    field: keyof Omit<TemplateFormState, "slotDefaults">,
    value: string
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  function updateSlot(
    slotIndex: number,
    field: keyof TemplateFormSlot,
    nextValue: string
  ) {
    setFormState((currentState) => ({
      ...currentState,
      slotDefaults: currentState.slotDefaults.map((slot, index) => {
        if (index !== slotIndex) {
          return slot;
        }

        if (field === "positionId") {
          return {
            ...slot,
            positionId: nextValue,
          };
        }

        return {
          ...slot,
          [field]: Number(nextValue),
        };
      }),
    }));
  }

  function addSlotRow() {
    setFormState((currentState) => ({
      ...currentState,
      slotDefaults: [
        ...currentState.slotDefaults,
        {
          positionId: defaultPositionId,
          requiredCount: 1,
          trainingCount: 0,
        },
      ],
    }));
  }

  function removeSlotRow(slotIndex: number) {
    setFormState((currentState) => ({
      ...currentState,
      slotDefaults:
        currentState.slotDefaults.length === 1
          ? currentState.slotDefaults
          : currentState.slotDefaults.filter((_, index) => index !== slotIndex),
    }));
  }

  function startEdit(template: EventTemplate) {
    setEditingTemplateId(template.id);
    setFormError(null);
    setFormState({
      firstServiceAt: template.firstServiceAt,
      lastServiceEndAt: template.lastServiceEndAt,
      name: template.name,
      slotDefaults: template.slotDefaults.map((slot) => ({
        positionId: slot.positionId,
        requiredCount: slot.requiredCount,
        trainingCount: slot.trainingCount,
      })),
    });
  }

  async function remove(template: EventTemplate) {
    const shouldDelete = window.confirm(
      `"${template.name}" 템플릿을 삭제할까요?`
    );

    if (!shouldDelete) {
      return;
    }

    setFormError(null);

    try {
      await deleteTemplateMutation.mutateAsync({ id: template.id });

      if (editingTemplateId === template.id) {
        resetForm(defaultPositionId);
      }

      onDeleted?.(template.id);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "행사 템플릿을 삭제하지 못했습니다."
      );
    }
  }

  function resetForm(nextDefaultPositionId = defaultPositionId) {
    setEditingTemplateId(null);
    setFormError(null);
    setFormState(createDefaultFormState(nextDefaultPositionId));
  }

  return {
    addSlotRow,
    deleteTemplateMutation,
    editingTemplateId,
    formError,
    formState,
    isSaving,
    remove,
    removeSlotRow,
    resetForm,
    startEdit,
    submit,
    updateField,
    updateSlot,
  };
}

function createDefaultFormState(defaultPositionId: string): TemplateFormState {
  return {
    firstServiceAt: "10:30",
    lastServiceEndAt: "16:00",
    name: "",
    slotDefaults: [
      {
        positionId: defaultPositionId,
        requiredCount: 2,
        trainingCount: 0,
      },
    ],
  };
}
