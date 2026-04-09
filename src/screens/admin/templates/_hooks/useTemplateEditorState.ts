import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useEffect, useState } from "react";
import {
  type Control,
  useFieldArray,
  useForm,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useCreateEventTemplateMutation } from "#/mutations/events/hooks/useCreateEventTemplateMutation";
import { useDeleteEventTemplateMutation } from "#/mutations/events/hooks/useDeleteEventTemplateMutation";
import { useUpdateEventTemplateMutation } from "#/mutations/events/hooks/useUpdateEventTemplateMutation";
import {
  createEventTemplateInputSchema,
  type CreateEventTemplateInput,
} from "#/mutations/events/schemas/createEventTemplate";
import {
  createDefaultTemplateFormValues,
  createTemplateFormValuesFromTemplate,
  createTemplateSlot,
  createTemplateSlotRows,
  readDefaultRequiredCount,
  readFirstErrorMessage,
  templateDeleteErrorMessage,
  type TemplateFieldName,
  type TemplateFormSlot,
  type TemplateFormState,
  templateSaveErrorMessage,
} from "#/screens/admin/templates/_helpers/templateForm";

type UseTemplateEditorStateOptions = {
  defaultPositionId: string;
  defaultRequiredCount: number;
  defaultRequiredCountByPositionId: Record<string, number>;
  highlightedTemplateId: string | null;
  setHighlightedTemplateId: (value: string | null) => void;
  setSearchTerm: (value: string) => void;
};

export function useTemplateEditorState({
  defaultPositionId,
  defaultRequiredCount,
  defaultRequiredCountByPositionId,
  highlightedTemplateId,
  setHighlightedTemplateId,
  setSearchTerm,
}: UseTemplateEditorStateOptions) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createTemplateMutation = useCreateEventTemplateMutation();
  const updateTemplateMutation = useUpdateEventTemplateMutation();
  const deleteTemplateMutation = useDeleteEventTemplateMutation();
  const form = useForm<CreateEventTemplateInput>({
    defaultValues: createDefaultTemplateFormValues(
      defaultPositionId,
      defaultRequiredCount
    ),
    resolver: zodResolver(createEventTemplateInputSchema),
  });
  const slotFieldArray = useFieldArray({
    control: form.control,
    name: "slotDefaults",
  });
  const { formState, slotDefaults } = useTemplateFormSnapshot(form.control);
  const slotRows = createTemplateSlotRows(
    slotFieldArray.fields,
    slotDefaults,
    defaultPositionId,
    defaultRequiredCountByPositionId,
    defaultRequiredCount
  );
  const isSaving =
    createTemplateMutation.isPending || updateTemplateMutation.isPending;
  const error = submitError ?? readFirstErrorMessage(form.formState.errors);

  useSyncTemplateSlotDefaults({
    defaultPositionId,
    defaultRequiredCount,
    defaultRequiredCountByPositionId,
    form,
    replaceSlotDefaults: slotFieldArray.replace,
  });

  const submit = form.handleSubmit(
    async (values) => {
      setSubmitError(null);

      try {
        const template = editingTemplateId
          ? await updateTemplateMutation.mutateAsync({
              id: editingTemplateId,
              ...values,
            })
          : await createTemplateMutation.mutateAsync(values);

        startTransition(() => {
          closeEditor();
          setSearchTerm("");
          setHighlightedTemplateId(template.id);
        });
      } catch (nextError) {
        setSubmitError(
          nextError instanceof Error
            ? nextError.message
            : templateSaveErrorMessage
        );
      }
    },
    () => {
      setSubmitError(null);
    }
  );

  function openCreate() {
    setEditingTemplateId(null);
    setSubmitError(null);
    form.reset(
      createDefaultTemplateFormValues(defaultPositionId, defaultRequiredCount)
    );
    setIsEditorOpen(true);
  }

  function updateField(field: TemplateFieldName, value: string) {
    setSubmitError(null);
    form.clearErrors(field);
    form.setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function updateSlot(
    slotIndex: number,
    field: keyof TemplateFormSlot,
    nextValue: string
  ) {
    setSubmitError(null);
    form.clearErrors(`slotDefaults.${slotIndex}.${field}`);

    if (field === "positionId") {
      const nextRequiredCount = readDefaultRequiredCount(
        nextValue,
        defaultRequiredCountByPositionId,
        defaultRequiredCount
      );

      form.setValue(`slotDefaults.${slotIndex}.positionId`, nextValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue(`slotDefaults.${slotIndex}.requiredCount`, nextRequiredCount, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    form.setValue(`slotDefaults.${slotIndex}.${field}`, Number(nextValue), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function addSlotRow() {
    setSubmitError(null);
    slotFieldArray.append(
      createTemplateSlot(defaultPositionId, defaultRequiredCount)
    );
  }

  function removeSlotRow(slotIndex: number) {
    if (slotFieldArray.fields.length === 1) {
      return;
    }

    setSubmitError(null);
    slotFieldArray.remove(slotIndex);
  }

  function startEdit(template: EventTemplate) {
    setEditingTemplateId(template.id);
    setSubmitError(null);
    setHighlightedTemplateId(template.id);
    form.reset(createTemplateFormValuesFromTemplate(template));
    setIsEditorOpen(true);
  }

  async function remove(template: EventTemplate) {
    setSubmitError(null);

    try {
      await deleteTemplateMutation.mutateAsync({ id: template.id });

      if (highlightedTemplateId === template.id) {
        setHighlightedTemplateId(null);
      }

      if (editingTemplateId === template.id) {
        closeEditor();
      }
    } catch (nextError) {
      setSubmitError(
        nextError instanceof Error
          ? nextError.message
          : templateDeleteErrorMessage
      );
    }
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingTemplateId(null);
    setSubmitError(null);
    form.reset(
      createDefaultTemplateFormValues(defaultPositionId, defaultRequiredCount)
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      closeEditor();
    }
  }

  return {
    addSlotRow,
    closeEditor,
    deletePending: deleteTemplateMutation.isPending,
    editingTemplateId,
    error,
    formState,
    isEditorOpen,
    isSaving,
    onOpenChange: handleOpenChange,
    openCreate,
    remove,
    removeSlotRow,
    slotRows,
    startEdit,
    submit,
    updateField,
    updateSlot,
  };
}

function useTemplateFormSnapshot(control: Control<CreateEventTemplateInput>) {
  const firstServiceAt = useWatch({
    control,
    name: "firstServiceAt",
  });
  const lastServiceEndAt = useWatch({
    control,
    name: "lastServiceEndAt",
  });
  const name = useWatch({
    control,
    name: "name",
  });
  const slotDefaults = useWatch({
    control,
    name: "slotDefaults",
  });

  return {
    formState: {
      firstServiceAt: firstServiceAt ?? "",
      lastServiceEndAt: lastServiceEndAt ?? "",
      name: name ?? "",
    } satisfies TemplateFormState,
    slotDefaults,
  };
}

function useSyncTemplateSlotDefaults({
  defaultPositionId,
  defaultRequiredCount,
  defaultRequiredCountByPositionId,
  form,
  replaceSlotDefaults,
}: {
  defaultPositionId: string;
  defaultRequiredCount: number;
  defaultRequiredCountByPositionId: Record<string, number>;
  form: UseFormReturn<CreateEventTemplateInput>;
  replaceSlotDefaults: (value: TemplateFormSlot[]) => void;
}) {
  useEffect(() => {
    if (!defaultPositionId) {
      return;
    }

    const currentSlots = form.getValues("slotDefaults") ?? [];

    if (currentSlots.length === 0) {
      replaceSlotDefaults([
        createTemplateSlot(defaultPositionId, defaultRequiredCount),
      ]);
      return;
    }

    if (currentSlots.some((slot) => !slot.positionId)) {
      replaceSlotDefaults(
        currentSlots.map((slot) => {
          if (slot.positionId) {
            return slot;
          }

          return {
            ...slot,
            positionId: defaultPositionId,
            requiredCount:
              slot.requiredCount > 0
                ? slot.requiredCount
                : readDefaultRequiredCount(
                    defaultPositionId,
                    defaultRequiredCountByPositionId,
                    defaultRequiredCount
                  ),
          };
        })
      );
    }
  }, [
    defaultPositionId,
    defaultRequiredCount,
    defaultRequiredCountByPositionId,
    form,
    replaceSlotDefaults,
  ]);
}
