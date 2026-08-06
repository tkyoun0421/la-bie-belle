"use client";

import { useState } from "react";

import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

type RejectReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
};

export function RejectReasonDialog({ open, onOpenChange, onConfirm }: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="가입을 거절할까요?"
      description="거절 사유는 관리자 확인용으로만 기록되고 화면에는 노출되지 않아요"
      confirmLabel="거절하기"
      tone="destructive"
      onConfirm={() => {
        onConfirm(reason);
        setReason("");
      }}
    >
      <Input
        label="거절 사유(선택)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
    </Dialog>
  );
}
