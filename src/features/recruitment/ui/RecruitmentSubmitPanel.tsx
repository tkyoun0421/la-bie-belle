"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type RecruitmentSubmitPanelProps = {
  selectedCount: number;
  deadline: string;
  onDeadlineChange: (value: string) => void;
  deadlineError: string | null;
  conflictDates: readonly string[];
  pending: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
};

export function RecruitmentSubmitPanel({
  selectedCount,
  deadline,
  onDeadlineChange,
  deadlineError,
  conflictDates,
  pending,
  submitDisabled,
  onSubmit,
}: RecruitmentSubmitPanelProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface pt-4">
      <span className="typo-label text-text-strong">{selectedCount}개 선택</span>
      <Input
        label="마감일"
        type="date"
        value={deadline}
        onChange={(event) => onDeadlineChange(event.target.value)}
        error={deadlineError ?? undefined}
      />
      {conflictDates.length > 0 ? (
        <p className="typo-caption text-danger">
          이미 모집 중인 날짜가 있어요: {conflictDates.join(", ")}
        </p>
      ) : null}
      <Button
        variant="primary"
        onClick={onSubmit}
        loading={pending}
        disabled={submitDisabled || pending}
      >
        모집 오픈
      </Button>
    </div>
  );
}
