import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useEffect, useMemo, useState } from "react";
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
  createTemplateFormValuesFromTemplate,
  createTemplateSlot,
  createTemplateSlotRows,
  findNextAvailablePositionId,
  primaryTemplateDeleteErrorMessage,
  readDefaultRequiredCount,
  readFirstErrorMessage,
  shouldConfirmBelowDefaultRequiredCount,
  templateDeleteErrorMessage,
  type TemplateFieldName,
  type TemplateFormSlot,
  type TemplateFormState,
  templateSaveErrorMessage,
} from "#/screens/admin/templates/_helpers/templateForm";
import { useDragReorderState } from "#/shared/hooks/useDragReorderState";

type UseTemplateEditorStateOptions = {
  defaultPositionId: string;
  defaultRequiredCount: number;
  defaultRequiredCountByPositionId: Record<string, number>;
  defaultTemplateValues: CreateEventTemplateInput;
  highlightedTemplateId: string | null;
  positionIds: string[];
  positionNameById: Record<string, string>;
  setHighlightedTemplateId: (value: string | null) => void;
  setSearchTerm: (value: string) => void;
  templates: EventTemplate[];
};

type PendingBelowDefaultRequiredCount = {
  nextRequiredCount: number;
  positionDefaultRequiredCount: number;
  positionName: string;
  slotIndex: number;
};

export function useTemplateEditorState({
  defaultPositionId,
  defaultRequiredCount,
  defaultRequiredCountByPositionId,
  defaultTemplateValues,
  highlightedTemplateId,
  positionIds,
  positionNameById,
  setHighlightedTemplateId,
  setSearchTerm,
  templates,
}: UseTemplateEditorStateOptions) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDeleteTemplate, setPendingDeleteTemplate] =
    useState<EventTemplate | null>(null);
  const [
    pendingBelowDefaultRequiredCount,
    setPendingBelowDefaultRequiredCount,
  ] = useState<PendingBelowDefaultRequiredCount | null>(null);
  const createTemplateMutation = useCreateEventTemplateMutation();
  const updateTemplateMutation = useUpdateEventTemplateMutation();
  const deleteTemplateMutation = useDeleteEventTemplateMutation();
  const form = useForm<CreateEventTemplateInput>({
    defaultValues: defaultTemplateValues,
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
  const editingTemplate = useMemo(
    () =>
      editingTemplateId
        ? templates.find((template) => template.id === editingTemplateId) ?? null
        : null,
    [editingTemplateId, templates]
  );
  const isPrimaryLocked = templates.length === 0 || Boolean(editingTemplate?.isPrimary);
  const isSaving =
    createTemplateMutation.isPending || updateTemplateMutation.isPending;
  const error = submitError ?? readFirstErrorMessage(form.formState.errors);
  const {
    clearDragState: clearSlotDragState,
    draggingItemId: draggingSlotKey,
    dropTargetItemId: dropTargetSlotKey,
    setDropTarget: setSlotDropTarget,
    startDrag: startSlotDrag,
  } = useDragReorderState({
    disabled: slotFieldArray.fields.length <= 1,
  });

  useSyncTemplateSlotDefaults({
    defaultPositionId,
    defaultRequiredCount,
    defaultRequiredCountByPositionId,
    defaultSlotDefaults: defaultTemplateValues.slotDefaults,
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
    clearSlotDragState();
    setPendingBelowDefaultRequiredCount(null);
    setSubmitError(null);
    form.reset(defaultTemplateValues);
    setIsEditorOpen(true);
  }

  function updateField(field: TemplateFieldName, value: string) {
    setPendingBelowDefaultRequiredCount(null);
    setSubmitError(null);
    form.clearErrors(field);
    form.setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function updatePrimary(nextValue: boolean) {
    if (isPrimaryLocked && !nextValue) {
      return;
    }

    setSubmitError(null);
    form.clearErrors("isPrimary");
    form.setValue("isPrimary", nextValue, {
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
      const currentSlots = form.getValues("slotDefaults") ?? [];
      const isDuplicateSelection = currentSlots.some(
        (slot, index) => index !== slotIndex && slot.positionId === nextValue
      );

      if (isDuplicateSelection) {
        return;
      }

      const nextRequiredCount = readDefaultRequiredCount(
        nextValue,
        defaultRequiredCountByPositionId,
        defaultRequiredCount
      );

      setPendingBelowDefaultRequiredCount(null);
      form.setValue(`slotDefaults.${slotIndex}.positionId`, nextValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue(
        `slotDefaults.${slotIndex}.requiredCount`,
        nextRequiredCount,
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
      return;
    }

    const parsedNumber = Number(nextValue);
    const nextNumber = Number.isFinite(parsedNumber) ? parsedNumber : 0;

    if (field === "requiredCount") {
      const currentSlot = form.getValues(`slotDefaults.${slotIndex}`);

      if (!currentSlot) {
        return;
      }

      const positionDefaultRequiredCount = readDefaultRequiredCount(
        currentSlot.positionId,
        defaultRequiredCountByPositionId,
        defaultRequiredCount
      );

      if (
        nextNumber >= 1 &&
        shouldConfirmBelowDefaultRequiredCount({
          currentRequiredCount: currentSlot.requiredCount,
          nextRequiredCount: nextNumber,
          positionDefaultRequiredCount,
        })
      ) {
        setPendingBelowDefaultRequiredCount({
          nextRequiredCount: nextNumber,
          positionDefaultRequiredCount,
          positionName:
            positionNameById[currentSlot.positionId] ?? "선택한 포지션",
          slotIndex,
        });
        return;
      }
    }

    setPendingBelowDefaultRequiredCount(null);
    form.setValue(`slotDefaults.${slotIndex}.${field}`, nextNumber, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function confirmBelowDefaultRequiredCount() {
    if (!pendingBelowDefaultRequiredCount) {
      return;
    }

    setPendingBelowDefaultRequiredCount(null);
    form.clearErrors(
      `slotDefaults.${pendingBelowDefaultRequiredCount.slotIndex}.requiredCount`
    );
    form.setValue(
      `slotDefaults.${pendingBelowDefaultRequiredCount.slotIndex}.requiredCount`,
      pendingBelowDefaultRequiredCount.nextRequiredCount,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }

  function cancelBelowDefaultRequiredCount() {
    setPendingBelowDefaultRequiredCount(null);
  }

  function addSlotRow() {
    const currentSlots = form.getValues("slotDefaults") ?? [];
    const nextPositionId = findNextAvailablePositionId(
      currentSlots,
      positionIds,
      defaultPositionId
    );

    if (
      !nextPositionId ||
      currentSlots.some((slot) => slot.positionId === nextPositionId)
    ) {
      return;
    }

    clearSlotDragState();
    setPendingBelowDefaultRequiredCount(null);
    setSubmitError(null);
    slotFieldArray.append(
      createTemplateSlot(
        nextPositionId,
        readDefaultRequiredCount(
          nextPositionId,
          defaultRequiredCountByPositionId,
          defaultRequiredCount
        )
      )
    );
  }

  function removeSlotRow(slotIndex: number) {
    if (slotFieldArray.fields.length === 1) {
      return;
    }

    clearSlotDragState();
    setPendingBelowDefaultRequiredCount(null);
    setSubmitError(null);
    slotFieldArray.remove(slotIndex);
  }

  function dropOnSlot(slotKey: string) {
    if (!draggingSlotKey || draggingSlotKey === slotKey) {
      clearSlotDragState();
      return;
    }

    const sourceIndex = slotRows.findIndex(
      (slot) => slot._key === draggingSlotKey
    );
    const targetIndex = slotRows.findIndex((slot) => slot._key === slotKey);

    if (sourceIndex === -1 || targetIndex === -1) {
      clearSlotDragState();
      return;
    }

    slotFieldArray.move(sourceIndex, targetIndex);
    clearSlotDragState();
  }

  function startEdit(template: EventTemplate) {
    setEditingTemplateId(template.id);
    clearSlotDragState();
    setPendingBelowDefaultRequiredCount(null);
    setSubmitError(null);
    setHighlightedTemplateId(template.id);
    form.reset(createTemplateFormValuesFromTemplate(template));
    setIsEditorOpen(true);
  }

  function remove(template: EventTemplate) {
    if (template.isPrimary) {
      setSubmitError(primaryTemplateDeleteErrorMessage);
      return;
    }

    clearSlotDragState();
    setPendingBelowDefaultRequiredCount(null);
    setSubmitError(null);
    setPendingDeleteTemplate(template);
  }

  async function confirmRemove() {
    if (!pendingDeleteTemplate) {
      return;
    }

    const template = pendingDeleteTemplate;
    setPendingDeleteTemplate(null);
    clearSlotDragState();
    setPendingBelowDefaultRequiredCount(null);
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

  function cancelRemove() {
    setPendingDeleteTemplate(null);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setPendingDeleteTemplate(null);
    clearSlotDragState();
    setPendingBelowDefaultRequiredCount(null);
    setSubmitError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      closeEditor();
    }
  }

  return {
    addSlotRow,
    cancelBelowDefaultRequiredCount,
    cancelRemove,
    clearSlotDragState,
    closeEditor,
    confirmBelowDefaultRequiredCount,
    confirmRemove,
    deletePending: deleteTemplateMutation.isPending,
    draggingSlotKey,
    dropOnSlot,
    dropTargetSlotKey,
    editingTemplateId,
    error,
    formState,
    isEditorOpen,
    isPrimaryLocked,
    isSaving,
    onOpenChange: handleOpenChange,
    openCreate,
    pendingDeleteTemplate,
    pendingBelowDefaultRequiredCount,
    remove,
    removeSlotRow,
    setSlotDropTarget,
    slotRows,
    startEdit,
    startSlotDrag,
    submit,
    updateField,
    updatePrimary,
    updateSlot,
  };
}

function useTemplateFormSnapshot(control: Control<CreateEventTemplateInput>) {
  const firstServiceAt = useWatch({
    control,
    name: "firstServiceAt",
  });
  const isPrimary = useWatch({
    control,
    name: "isPrimary",
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
      isPrimary: isPrimary ?? false,
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
  defaultSlotDefaults,
  form,
  replaceSlotDefaults,
}: {
  defaultPositionId: string;
  defaultRequiredCount: number;
  defaultRequiredCountByPositionId: Record<string, number>;
  defaultSlotDefaults: TemplateFormSlot[];
  form: UseFormReturn<CreateEventTemplateInput>;
  replaceSlotDefaults: (value: TemplateFormSlot[]) => void;
}) {
  useEffect(() => {
    const currentSlots = form.getValues("slotDefaults") ?? [];

    if (currentSlots.length === 0) {
      if (defaultSlotDefaults.length > 0) {
        replaceSlotDefaults(defaultSlotDefaults);
        return;
      }

      if (defaultPositionId) {
        replaceSlotDefaults([
          createTemplateSlot(defaultPositionId, defaultRequiredCount),
        ]);
      }

      return;
    }

    if (currentSlots.some((slot) => !slot.positionId) && defaultPositionId) {
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
    defaultSlotDefaults,
    form,
    replaceSlotDefaults,
  ]);
}
