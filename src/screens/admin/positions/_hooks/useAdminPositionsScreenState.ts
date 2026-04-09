import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Position } from "#/entities/positions/models/schemas/position";
import {
  createPositionInputSchema,
  type CreatePositionInput,
} from "#/mutations/positions/schemas/createPosition";
import { useCreatePositionMutation } from "#/mutations/positions/hooks/useCreatePositionMutation";
import { useDeletePositionMutation } from "#/mutations/positions/hooks/useDeletePositionMutation";
import { useUpdatePositionMutation } from "#/mutations/positions/hooks/useUpdatePositionMutation";
import { usePositionCollectionState } from "#/queries/positions/hooks/usePositionCollectionState";

const defaultPositionFormValues: CreatePositionInput = {
  allowedGender: "all",
  name: "",
};

export function useAdminPositionsScreenState() {
  const { filteredPositions, positions, searchTerm, setSearchTerm } =
    usePositionCollectionState();
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createPositionMutation = useCreatePositionMutation();
  const updatePositionMutation = useUpdatePositionMutation();
  const deletePositionMutation = useDeletePositionMutation();
  const form = useForm<CreatePositionInput>({
    defaultValues: defaultPositionFormValues,
    resolver: zodResolver(createPositionInputSchema),
  });
  const name = useWatch({
    control: form.control,
    name: "name",
  });
  const allowedGender = useWatch({
    control: form.control,
    name: "allowedGender",
  });
  const isSaving =
    createPositionMutation.isPending || updatePositionMutation.isPending;
  const validationError = readFirstErrorMessage(form.formState.errors);
  const error = submitError ?? validationError;

  const submit = form.handleSubmit(
    async (values) => {
      setSubmitError(null);

      try {
        if (editingPositionId) {
          await updatePositionMutation.mutateAsync({
            id: editingPositionId,
            ...values,
          });
        } else {
          await createPositionMutation.mutateAsync(values);
        }

        resetForm();
      } catch (nextError) {
        setSubmitError(
          nextError instanceof Error
            ? nextError.message
            : "?ъ??섏쓣 ??ν븯吏 紐삵뻽?듬땲??"
        );
      }
    },
    () => {
      setSubmitError(null);
    }
  );

  function startEdit(position: Position) {
    setEditingPositionId(position.id);
    setSubmitError(null);
    form.reset({
      allowedGender: position.allowedGender,
      name: position.name,
    });
  }

  async function remove(position: Position) {
    const shouldDelete = window.confirm(
      `"${position.name}" ?ъ??섏쓣 ??젣?좉퉴??`
    );

    if (!shouldDelete) {
      return;
    }

    setSubmitError(null);

    try {
      await deletePositionMutation.mutateAsync({ id: position.id });

      if (editingPositionId === position.id) {
        resetForm();
      }
    } catch (nextError) {
      setSubmitError(
        nextError instanceof Error
          ? nextError.message
          : "?ъ??섏쓣 ??젣?섏? 紐삵뻽?듬땲??"
      );
    }
  }

  function resetForm() {
    setEditingPositionId(null);
    setSubmitError(null);
    form.reset(defaultPositionFormValues);
  }

  function setAllowedGender(nextAllowedGender: CreatePositionInput["allowedGender"]) {
    setSubmitError(null);
    form.clearErrors("allowedGender");
    form.setValue("allowedGender", nextAllowedGender, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function setName(nextName: string) {
    setSubmitError(null);
    form.clearErrors("name");
    form.setValue("name", nextName, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return {
    allowedGender: allowedGender ?? "all",
    editingPositionId,
    error,
    filteredPositions,
    isDeleting: deletePositionMutation.isPending,
    isSaving,
    name: name ?? "",
    onAllowedGenderChange: setAllowedGender,
    onCancel: resetForm,
    onDelete: remove,
    onEdit: startEdit,
    onNameChange: setName,
    onSearchTermChange: setSearchTerm,
    onSubmit: submit,
    positions,
    searchTerm,
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
