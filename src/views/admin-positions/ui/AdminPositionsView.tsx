"use client";

import type { Position } from "@/entities/position/model/position";
import {
  usePositionEditor,
  type CreatePositionAction,
  type DeletePositionAction,
  type UpdatePositionAction,
} from "@/features/position/hooks/usePositionEditor";
import { PositionEditSheet } from "@/features/position/ui/PositionEditSheet";
import { PositionList } from "@/features/position/ui/PositionList";
import { Button } from "@/shared/ui/button";

type AdminPositionsViewProps = {
  positions: Position[];
  onCreate: CreatePositionAction;
  onUpdate: UpdatePositionAction;
  onDelete: DeletePositionAction;
};

export function AdminPositionsView({
  positions,
  onCreate,
  onUpdate,
  onDelete,
}: AdminPositionsViewProps) {
  const editor = usePositionEditor(onCreate, onUpdate, onDelete);

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="typo-display text-text-strong">포지션 관리</h1>
        <Button type="button" variant="secondary" onClick={editor.openCreate}>
          추가
        </Button>
      </div>
      <PositionList positions={positions} onSelect={editor.openEdit} />
      <PositionEditSheet
        editing={editor.editing}
        form={editor.form}
        pending={editor.pending}
        onClose={editor.close}
        onUpdateField={editor.updateField}
        onSave={editor.save}
        onRemove={editor.remove}
      />
    </main>
  );
}
