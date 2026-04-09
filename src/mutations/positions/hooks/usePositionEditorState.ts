import { useState } from "react";
import type {
  Position,
  PositionAllowedGender,
} from "#/entities/positions/models/schemas/position";
import { useCreatePositionMutation } from "#/mutations/positions/hooks/useCreatePositionMutation";
import { useDeletePositionMutation } from "#/mutations/positions/hooks/useDeletePositionMutation";
import { useUpdatePositionMutation } from "#/mutations/positions/hooks/useUpdatePositionMutation";

type PositionFormState = {
  allowedGender: PositionAllowedGender;
  name: string;
};

const defaultFormState: PositionFormState = {
  allowedGender: "all",
  name: "",
};

export function usePositionEditorState() {
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] =
    useState<PositionFormState>(defaultFormState);
  const createPositionMutation = useCreatePositionMutation();
  const updatePositionMutation = useUpdatePositionMutation();
  const deletePositionMutation = useDeletePositionMutation();
  const isSaving =
    createPositionMutation.isPending || updatePositionMutation.isPending;

  async function submit() {
    setFormError(null);

    try {
      if (editingPositionId) {
        await updatePositionMutation.mutateAsync({
          id: editingPositionId,
          ...formState,
        });
      } else {
        await createPositionMutation.mutateAsync(formState);
      }

      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "포지션을 저장하지 못했습니다."
      );
    }
  }

  function startEdit(position: Position) {
    setEditingPositionId(position.id);
    setFormError(null);
    setFormState({
      allowedGender: position.allowedGender,
      name: position.name,
    });
  }

  async function remove(position: Position) {
    const shouldDelete = window.confirm(
      `"${position.name}" 포지션을 삭제할까요?`
    );

    if (!shouldDelete) {
      return;
    }

    setFormError(null);

    try {
      await deletePositionMutation.mutateAsync({ id: position.id });

      if (editingPositionId === position.id) {
        resetForm();
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "포지션을 삭제하지 못했습니다."
      );
    }
  }

  function resetForm() {
    setEditingPositionId(null);
    setFormError(null);
    setFormState(defaultFormState);
  }

  return {
    deletePositionMutation,
    editingPositionId,
    formError,
    formState,
    isSaving,
    remove,
    resetForm,
    setAllowedGender(nextAllowedGender: PositionAllowedGender) {
      setFormState((currentState) => ({
        ...currentState,
        allowedGender: nextAllowedGender,
      }));
    },
    setName(nextName: string) {
      setFormState((currentState) => ({
        ...currentState,
        name: nextName,
      }));
    },
    startEdit,
    submit,
  };
}
