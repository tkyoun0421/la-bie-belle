"use client";

import type { ManagedRecruitmentSchedule } from "@/features/recruitment/hooks/useRecruitmentManage";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const STATUS_CONFLICT_MESSAGE = "상태가 바뀌었어요. 새로고침 후 다시 확인해 주세요";

type RecruitmentManageSheetProps = {
  managed: ManagedRecruitmentSchedule | null;
  deadline: string;
  onDeadlineChange: (value: string) => void;
  deadlineError: string | null;
  statusConflict: boolean;
  pending: boolean;
  onSubmit: () => void;
  onClose: () => void;
};

export function RecruitmentManageSheet({
  managed,
  deadline,
  onDeadlineChange,
  deadlineError,
  statusConflict,
  pending,
  onSubmit,
  onClose,
}: RecruitmentManageSheetProps) {
  const isReopen = managed?.status === "CLOSED";

  return (
    <BottomSheet
      open={managed !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={isReopen ? "모집 재오픈" : "마감일 연장"}
      description={
        managed
          ? `근무일 ${managed.workDate} · 현재 마감일 ${managed.applicationDeadline}`
          : undefined
      }
      footer={
        <Button
          variant="primary"
          onClick={onSubmit}
          loading={pending}
          disabled={pending || deadlineError !== null}
        >
          {isReopen ? "재오픈" : "저장"}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 py-4">
        {statusConflict ? (
          <p className="typo-caption text-danger">{STATUS_CONFLICT_MESSAGE}</p>
        ) : null}
        <Input
          label="새 마감일"
          type="date"
          value={deadline}
          onChange={(event) => onDeadlineChange(event.target.value)}
          error={deadlineError ?? undefined}
        />
      </div>
    </BottomSheet>
  );
}
