import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { formatPositionAllowedGenderLabel } from "#/entities/positions/models/constants/allowedGender";
import {
  createEventTemplateInputSchema,
  type CreateEventTemplateInput,
} from "#/mutations/events/schemas/createEventTemplate";
import { useCreateEventTemplateMutation } from "#/mutations/events/hooks/useCreateEventTemplateMutation";
import { useDeleteEventTemplateMutation } from "#/mutations/events/hooks/useDeleteEventTemplateMutation";
import { useUpdateEventTemplateMutation } from "#/mutations/events/hooks/useUpdateEventTemplateMutation";
import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";
import { usePositionsQuery } from "#/queries/positions/hooks/usePositionsQuery";

type TemplateFormSlot = CreateEventTemplateInput["slotDefaults"][number];

export function useAdminTemplatesScreenState() {
  const positionsQuery = usePositionsQuery();
  const positions = positionsQuery.data ?? [];
  const {
    filteredTemplates,
    highlightedTemplateId,
    searchTerm,
    setHighlightedTemplateId,
    setSearchTerm,
  } = useEventTemplateCollectionState();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createTemplateMutation = useCreateEventTemplateMutation();
  const updateTemplateMutation = useUpdateEventTemplateMutation();
  const deleteTemplateMutation = useDeleteEventTemplateMutation();
  const defaultPositionId = positions[0]?.id ?? "";
  const form = useForm<CreateEventTemplateInput>({
    defaultValues: createDefaultTemplateFormValues(defaultPositionId),
    resolver: zodResolver(createEventTemplateInputSchema),
  });
  const slotFieldArray = useFieldArray({
    control: form.control,
    name: "slotDefaults",
  });
  const firstServiceAt = useWatch({
    control: form.control,
    name: "firstServiceAt",
  });
  const lastServiceEndAt = useWatch({
    control: form.control,
    name: "lastServiceEndAt",
  });
  const name = useWatch({
    control: form.control,
    name: "name",
  });
  const slotDefaults = useWatch({
    control: form.control,
    name: "slotDefaults",
  });
  const isSaving =
    createTemplateMutation.isPending || updateTemplateMutation.isPending;
  const validationError = readFirstErrorMessage(form.formState.errors);
  const error = submitError ?? validationError;
  const positionOptions = positions.map((position) => ({
    label: `${position.name} - ${formatPositionAllowedGenderLabel(position.allowedGender)}`,
    value: position.id,
  }));
  const slotRows = slotFieldArray.fields.map((field, index) => ({
    _key: field.id,
    ...(slotDefaults?.[index] ?? createTemplateSlot(defaultPositionId)),
  }));

  useEffect(() => {
    if (!defaultPositionId) {
      return;
    }

    const currentSlots = form.getValues("slotDefaults");

    if (currentSlots.length === 0) {
      slotFieldArray.replace([createTemplateSlot(defaultPositionId)]);
      return;
    }

    if (currentSlots.some((slot) => !slot.positionId)) {
      slotFieldArray.replace(
        currentSlots.map((slot) => ({
          ...slot,
          positionId: slot.positionId || defaultPositionId,
        }))
      );
    }
  }, [defaultPositionId, form, slotFieldArray]);

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
          resetForm(defaultPositionId);
          setSearchTerm("");
          setHighlightedTemplateId(template.id);
        });
      } catch (nextError) {
        setSubmitError(
          nextError instanceof Error
            ? nextError.message
            : "행사 템플릿을 저장하지 못했습니다."
        );
      }
    },
    () => {
      setSubmitError(null);
    }
  );

  function updateField(
    field: "firstServiceAt" | "lastServiceEndAt" | "name",
    value: string
  ) {
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
    const nextFieldValue =
      field === "positionId" ? nextValue : Number(nextValue);

    setSubmitError(null);
    form.clearErrors(`slotDefaults.${slotIndex}.${field}`);
    form.setValue(`slotDefaults.${slotIndex}.${field}`, nextFieldValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function addSlotRow() {
    setSubmitError(null);
    slotFieldArray.append(createTemplateSlot(defaultPositionId));
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
    form.reset({
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

    setSubmitError(null);

    try {
      await deleteTemplateMutation.mutateAsync({ id: template.id });

      if (highlightedTemplateId === template.id) {
        setHighlightedTemplateId(null);
      }

      if (editingTemplateId === template.id) {
        resetForm(defaultPositionId);
      }
    } catch (nextError) {
      setSubmitError(
        nextError instanceof Error
          ? nextError.message
          : "행사 템플릿을 삭제하지 못했습니다."
      );
    }
  }

  function resetForm(nextDefaultPositionId = defaultPositionId) {
    setEditingTemplateId(null);
    setSubmitError(null);
    form.reset(createDefaultTemplateFormValues(nextDefaultPositionId));
  }

  return {
    deletePending: deleteTemplateMutation.isPending,
    editingTemplateId,
    error,
    filteredTemplates,
    formState: {
      firstServiceAt: firstServiceAt ?? "",
      lastServiceEndAt: lastServiceEndAt ?? "",
      name: name ?? "",
    },
    highlightedTemplateId,
    isSaving,
    onAddSlotRow: addSlotRow,
    onCancel: () => resetForm(defaultPositionId),
    onDelete: remove,
    onEdit: startEdit,
    onFieldChange: updateField,
    onRemoveSlotRow: removeSlotRow,
    onSearchTermChange: setSearchTerm,
    onSubmit: submit,
    onUpdateSlot: updateSlot,
    positionOptions,
    searchTerm,
    slotRows,
  };
}

function createDefaultTemplateFormValues(
  defaultPositionId: string
): CreateEventTemplateInput {
  return {
    firstServiceAt: "10:30",
    lastServiceEndAt: "16:00",
    name: "",
    slotDefaults: [createTemplateSlot(defaultPositionId)],
  };
}

function createTemplateSlot(defaultPositionId: string): TemplateFormSlot {
  return {
    positionId: defaultPositionId,
    requiredCount: 2,
    trainingCount: 0,
  };
}

function readFirstErrorMessage(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if (
      "message" in value &&
      typeof value.message === "string" &&
      value.message.length > 0
    ) {
      return value.message;
    }

    if (Array.isArray(value)) {
      for (const nextValue of value) {
        const nextMessage = readFirstErrorMessage(nextValue);

        if (nextMessage) {
          return nextMessage;
        }
      }

      return null;
    }

    for (const nextValue of Object.values(value)) {
      const nextMessage = readFirstErrorMessage(nextValue);

      if (nextMessage) {
        return nextMessage;
      }
    }
  }

  return null;
}
