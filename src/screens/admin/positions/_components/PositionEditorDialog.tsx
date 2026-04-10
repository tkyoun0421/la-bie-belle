"use client";

import type { Position } from "#/entities/positions/models/schemas/position";
import { PositionEditorCard } from "#/screens/admin/positions/_components/PositionEditorCard";
import { usePositionEditorDialogState } from "#/screens/admin/positions/_hooks/usePositionEditorDialogState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "#/shared/components/ui/dialog";

type PositionEditorDialogProps = {
  initialPosition: Position | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  requestKey: number;
};

export function PositionEditorDialog({
  initialPosition,
  onOpenChange,
  open,
  requestKey,
}: Readonly<PositionEditorDialogProps>) {
  const editorState = usePositionEditorDialogState({
    initialPosition,
    onClose: () => onOpenChange(false),
    requestKey,
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="border-0 bg-transparent p-0 shadow-none sm:max-w-[560px]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {editorState.isEditing ? "포지션 수정" : "새 포지션 추가"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          포지션 이름, 가능 성별, 기본 필수 인원을 설정합니다.
        </DialogDescription>
        <PositionEditorCard {...editorState} />
      </DialogContent>
    </Dialog>
  );
}
