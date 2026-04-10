import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Position } from "#/entities/positions/models/schemas/position";
import { useCreatePositionMutation } from "#/mutations/positions/hooks/useCreatePositionMutation";
import { useDeletePositionMutation } from "#/mutations/positions/hooks/useDeletePositionMutation";
import { useReorderPositionsMutation } from "#/mutations/positions/hooks/useReorderPositionsMutation";
import { useUpdatePositionMutation } from "#/mutations/positions/hooks/useUpdatePositionMutation";
import {
  createPositionInputSchema,
  type CreatePositionInput,
} from "#/mutations/positions/schemas/createPosition";
import { usePositionCollectionState } from "#/queries/positions/hooks/usePositionCollectionState";
import {
  readPositionDeleteErrorMessage,
  readPositionListErrorMessage,
  readPositionReorderErrorMessage,
  readPositionSaveErrorMessage,
} from "#/screens/admin/positions/_helpers/positionError";
import { useDragReorderState } from "#/shared/hooks/useDragReorderState";
import { readErrorMessage } from "#/shared/lib/forms/readErrorMessage";

const defaultPositionFormValues: CreatePositionInput = {
  allowedGender: "all",
  defaultRequiredCount: 2,
  name: "",
};

export function useAdminPositionsScreenState() {
  const {
    filteredPositions,
    positions,
    positionsQuery,
    searchTerm,
    setSearchTerm,
  } = usePositionCollectionState();
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [pendingDeletePosition, setPendingDeletePosition] =
    useState<Position | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const createPositionMutation = useCreatePositionMutation();
  const updatePositionMutation = useUpdatePositionMutation();
  const deletePositionMutation = useDeletePositionMutation();
  const reorderPositionsMutation = useReorderPositionsMutation();
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
  const defaultRequiredCount = useWatch({
    control: form.control,
    name: "defaultRequiredCount",
  });
  const isSaving =
    createPositionMutation.isPending || updatePositionMutation.isPending;
  const isReordering = reorderPositionsMutation.isPending;
  const isSearchActive = searchTerm.trim().length > 0;
  const canReorder = !isSearchActive && !isReordering;
  const resolvedListError =
    listError ??
    (positionsQuery.error
      ? readPositionListErrorMessage(positionsQuery.error)
      : null);
  const {
    clearDragState,
    draggingItemId: draggingPositionId,
    dropTargetItemId: dropTargetPositionId,
    setDropTarget,
    startDrag,
  } = useDragReorderState({
    disabled: !canReorder,
  });
  const fieldErrors = {
    allowedGender: readErrorMessage(form.formState.errors.allowedGender),
    defaultRequiredCount: readErrorMessage(
      form.formState.errors.defaultRequiredCount
    ),
    name: readErrorMessage(form.formState.errors.name),
  };

  const submit = form.handleSubmit(
    async (values) => {
      setEditorError(null);

      try {
        if (editingPositionId) {
          await updatePositionMutation.mutateAsync({
            id: editingPositionId,
            ...values,
          });
        } else {
          await createPositionMutation.mutateAsync(values);
        }

        closeEditor();
      } catch (nextError) {
        setEditorError(readPositionSaveErrorMessage(nextError));
      }
    },
    () => {
      setEditorError(null);
    }
  );

  function openCreate() {
    setEditingPositionId(null);
    setPendingDeletePosition(null);
    setEditorError(null);
    form.reset(defaultPositionFormValues);
    setIsEditorOpen(true);
  }

  function startEdit(position: Position) {
    setEditingPositionId(position.id);
    setPendingDeletePosition(null);
    setEditorError(null);
    form.reset({
      allowedGender: position.allowedGender,
      defaultRequiredCount: position.defaultRequiredCount,
      name: position.name,
    });
    setIsEditorOpen(true);
  }

  function requestRemove(position: Position) {
    setListError(null);
    setPendingDeletePosition(position);
  }

  async function confirmRemove() {
    if (!pendingDeletePosition) {
      return;
    }

    const position = pendingDeletePosition;
    setPendingDeletePosition(null);
    setListError(null);

    try {
      await deletePositionMutation.mutateAsync({ id: position.id });

      if (editingPositionId === position.id) {
        closeEditor();
      }
    } catch (nextError) {
      setListError(readPositionDeleteErrorMessage(nextError));
    }
  }

  function cancelRemove() {
    setPendingDeletePosition(null);
  }

  async function dropOnPosition(targetPositionId: string) {
    if (
      !draggingPositionId ||
      draggingPositionId === targetPositionId ||
      !canReorder
    ) {
      clearDragState();
      return;
    }

    const orderedIds = movePositionIds(
      positions.map((position) => position.id),
      draggingPositionId,
      targetPositionId
    );

    if (orderedIds.length === 0) {
      clearDragState();
      return;
    }

    try {
      setListError(null);
      await reorderPositionsMutation.mutateAsync({ positionIds: orderedIds });
    } catch (nextError) {
      setListError(readPositionReorderErrorMessage(nextError));
    } finally {
      clearDragState();
    }
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setPendingDeletePosition(null);
    setEditorError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      closeEditor();
    }
  }

  function setAllowedGender(
    nextAllowedGender: CreatePositionInput["allowedGender"]
  ) {
    setEditorError(null);
    form.clearErrors("allowedGender");
    form.setValue("allowedGender", nextAllowedGender, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function setDefaultRequiredCount(nextCount: number) {
    setEditorError(null);
    form.clearErrors("defaultRequiredCount");
    form.setValue("defaultRequiredCount", nextCount, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function setName(nextName: string) {
    setEditorError(null);
    form.clearErrors("name");
    form.setValue("name", nextName, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return {
    allowedGender: allowedGender ?? "all",
    canReorder,
    defaultRequiredCount: defaultRequiredCount ?? 2,
    draggingPositionId,
    dropTargetPositionId,
    editorError,
    editingPositionId,
    fieldErrors,
    filteredPositions,
    isDeleting: deletePositionMutation.isPending,
    isEditorOpen,
    isReordering,
    isSearchActive,
    isSaving,
    listError: resolvedListError,
    name: name ?? "",
    onAllowedGenderChange: setAllowedGender,
    onCancelDelete: cancelRemove,
    onCloseEditor: closeEditor,
    onConfirmDelete: confirmRemove,
    onDefaultRequiredCountChange: setDefaultRequiredCount,
    onDelete: requestRemove,
    onDragEnd: clearDragState,
    onDragStart: startDrag,
    onDrop: dropOnPosition,
    onDropTargetChange: setDropTarget,
    onEdit: startEdit,
    onNameChange: setName,
    onOpenChange: handleOpenChange,
    onOpenCreate: openCreate,
    onSearchTermChange: setSearchTerm,
    onSubmit: submit,
    pendingDeletePosition,
    positions,
    searchTerm,
  };
}

function movePositionIds(
  positionIds: string[],
  sourcePositionId: string,
  targetPositionId: string
) {
  const nextPositionIds = [...positionIds];
  const sourceIndex = nextPositionIds.indexOf(sourcePositionId);
  const targetIndex = nextPositionIds.indexOf(targetPositionId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return [];
  }

  const [movedPositionId] = nextPositionIds.splice(sourceIndex, 1);
  nextPositionIds.splice(targetIndex, 0, movedPositionId);

  return nextPositionIds;
}
