import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Position } from "#/entities/positions/models/schemas/position";
import { useCreatePositionMutation } from "#/mutations/positions/hooks/useCreatePositionMutation";
import { useUpdatePositionMutation } from "#/mutations/positions/hooks/useUpdatePositionMutation";
import {
  createPositionInputSchema,
  type CreatePositionInput,
} from "#/mutations/positions/schemas/createPosition";
import { readPositionSaveErrorMessage } from "#/screens/admin/positions/_helpers/positionError";
import { readErrorMessage } from "#/shared/lib/forms/readErrorMessage";

const defaultPositionFormValues: CreatePositionInput = {
  allowedGender: "all",
  defaultRequiredCount: 2,
  name: "",
};

type UsePositionEditorDialogStateOptions = {
  initialPosition: Position | null;
  onClose: () => void;
  requestKey: number;
};

export function usePositionEditorDialogState({
  initialPosition,
  onClose,
  requestKey,
}: UsePositionEditorDialogStateOptions) {
  void requestKey;

  const [editorError, setEditorError] = useState<string | null>(null);
  const createPositionMutation = useCreatePositionMutation();
  const updatePositionMutation = useUpdatePositionMutation();
  const form = useForm<CreatePositionInput>({
    defaultValues: initialPosition
      ? {
          allowedGender: initialPosition.allowedGender,
          defaultRequiredCount: initialPosition.defaultRequiredCount,
          name: initialPosition.name,
        }
      : defaultPositionFormValues,
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
        if (initialPosition) {
          await updatePositionMutation.mutateAsync({
            id: initialPosition.id,
            ...values,
          });
        } else {
          await createPositionMutation.mutateAsync(values);
        }

        onClose();
      } catch (nextError) {
        setEditorError(readPositionSaveErrorMessage(nextError));
      }
    },
    () => {
      setEditorError(null);
    }
  );

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
    defaultRequiredCount: defaultRequiredCount ?? 2,
    fieldErrors,
    isEditing: initialPosition !== null,
    isSaving,
    name: name ?? "",
    onAllowedGenderChange: setAllowedGender,
    onCancel: onClose,
    onDefaultRequiredCountChange: setDefaultRequiredCount,
    onNameChange: setName,
    onSubmit: submit,
    serverError: editorError,
  };
}
