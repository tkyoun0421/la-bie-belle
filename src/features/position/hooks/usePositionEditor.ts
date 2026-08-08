import { useState, useTransition } from "react";

import type { GenderRequirement, Position } from "@/entities/position/model/position";
import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type PositionMutationOutcome = { ok: true } | { ok: false; code: ErrorCode };

export type CreatePositionActionInput = {
  name: string;
  defaultRequiredCount: number;
  genderRequirement: GenderRequirement;
  isDefault: boolean;
};

export type UpdatePositionActionInput = CreatePositionActionInput & {
  id: string;
  isActive: boolean;
};

export type DeletePositionActionInput = { id: string };

export type CreatePositionAction = (
  input: CreatePositionActionInput,
) => Promise<PositionMutationOutcome>;
export type UpdatePositionAction = (
  input: UpdatePositionActionInput,
) => Promise<PositionMutationOutcome>;
export type DeletePositionAction = (
  input: DeletePositionActionInput,
) => Promise<PositionMutationOutcome>;

export type PositionFormValues = {
  name: string;
  defaultRequiredCount: number;
  genderRequirement: GenderRequirement;
  isDefault: boolean;
  isActive: boolean;
};

const EMPTY_FORM: PositionFormValues = {
  name: "",
  defaultRequiredCount: 1,
  genderRequirement: "any",
  isDefault: false,
  isActive: true,
};

export function usePositionEditor(
  onCreate: CreatePositionAction,
  onUpdate: UpdatePositionAction,
  onDelete: DeletePositionAction,
) {
  const [editing, setEditing] = useState<Position | "new" | null>(null);
  const [form, setForm] = useState<PositionFormValues>(EMPTY_FORM);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing("new");
  }

  function openEdit(position: Position) {
    setForm({
      name: position.name,
      defaultRequiredCount: position.defaultRequiredCount,
      genderRequirement: position.genderRequirement,
      isDefault: position.isDefault,
      isActive: position.isActive,
    });
    setEditing(position);
  }

  function close() {
    setEditing(null);
  }

  function updateField<K extends keyof PositionFormValues>(field: K, value: PositionFormValues[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function save() {
    if (editing === null) {
      return;
    }
    const isCreating = editing === "new";
    const targetId = editing === "new" ? null : editing.id;

    startTransition(async () => {
      const result = isCreating
        ? await onCreate({
            name: form.name,
            defaultRequiredCount: form.defaultRequiredCount,
            genderRequirement: form.genderRequirement,
            isDefault: form.isDefault,
          })
        : await onUpdate({
            id: targetId as string,
            name: form.name,
            defaultRequiredCount: form.defaultRequiredCount,
            genderRequirement: form.genderRequirement,
            isDefault: form.isDefault,
            isActive: form.isActive,
          });

      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
        return;
      }
      setEditing(null);
    });
  }

  function remove() {
    if (editing === null || editing === "new") {
      return;
    }
    const id = editing.id;

    startTransition(async () => {
      const result = await onDelete({ id });
      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
        return;
      }
      setEditing(null);
    });
  }

  return { editing, form, pending, openCreate, openEdit, close, updateField, save, remove };
}
