"use client";

import { Dialog } from "@/shared/ui/dialog";

const CLOSING_NOTICE = "모집도 함께 마감됩니다";
const UNDERSTAFFED_TITLE = "필요 인원 미달";
const NO_MANAGER_TITLE = "담당자 없음";

type UnderstaffedWarningProp = {
  positionId: string;
  positionName: string;
  requiredCount: number;
  assignedCount: number;
};

type NoManagerWarningProp = {
  positionId: string;
  positionName: string;
  traineeCount: number;
};

type ConfirmScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  understaffed: UnderstaffedWarningProp[];
  noManager: NoManagerWarningProp[];
  showClosingNotice: boolean;
  errorMessage: string | null;
  pending: boolean;
  onConfirm: () => void;
};

export function ConfirmScheduleDialog({
  open,
  onOpenChange,
  understaffed,
  noManager,
  showClosingNotice,
  errorMessage,
  pending,
  onConfirm,
}: ConfirmScheduleDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="스케줄을 확정할까요?"
      description="확정 후에는 확정 상태로 화면이 바뀌어요"
      confirmLabel={pending ? "확정 중" : "확정하기"}
      onConfirm={onConfirm}
    >
      <div className="mt-3 flex flex-col gap-3">
        {showClosingNotice ? <p className="typo-body text-text">{CLOSING_NOTICE}</p> : null}
        {understaffed.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="typo-caption text-text-strong">{UNDERSTAFFED_TITLE}</p>
            <ul className="flex flex-col gap-1">
              {understaffed.map((warning) => (
                <li key={warning.positionId} className="typo-body text-text">
                  {`${warning.positionName} · 필요 ${warning.requiredCount} / 배정 ${warning.assignedCount}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {noManager.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="typo-caption text-text-strong">{NO_MANAGER_TITLE}</p>
            <ul className="flex flex-col gap-1">
              {noManager.map((warning) => (
                <li key={warning.positionId} className="typo-body text-text">
                  {`${warning.positionName} · 교육 ${warning.traineeCount}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {errorMessage !== null ? <p className="typo-caption text-danger">{errorMessage}</p> : null}
      </div>
    </Dialog>
  );
}
