import { Button } from "@/shared/ui/button";

type ApplicationUndo = { count: number; execute: () => void };

type ApplicationChangeBarProps = {
  changeCount: number;
  submitting: boolean;
  onSave: () => void;
  undo: ApplicationUndo | null;
};

export function ApplicationChangeBar({
  changeCount,
  submitting,
  onSave,
  undo,
}: ApplicationChangeBarProps) {
  if (undo !== null) {
    return (
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 flex items-center justify-end border-t border-border bg-surface p-4">
        <Button
          variant="secondary"
          loading={submitting}
          disabled={submitting}
          onClick={undo.execute}
        >
          {`방금 변경한 ${undo.count}개 날짜 되돌리기`}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 flex items-center justify-between border-t border-border bg-surface p-4">
      <span className="typo-label text-text-strong">{changeCount}개 변경</span>
      <Button
        variant="primary"
        loading={submitting}
        disabled={changeCount === 0 || submitting}
        onClick={onSave}
      >
        신청하기
      </Button>
    </div>
  );
}
