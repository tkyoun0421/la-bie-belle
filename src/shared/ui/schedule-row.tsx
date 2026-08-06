import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { cn } from "@/shared/lib/cn";

type ScheduleRowProps = {
  date: Date;
  scheduledStart: string;
  scheduledEnd: string;
  position: string;
  status: string;
  changeNote?: string;
  onPress: () => void;
  className?: string;
};

export function ScheduleRow({
  date,
  scheduledStart,
  scheduledEnd,
  position,
  status,
  changeNote,
  onPress,
  className,
}: ScheduleRowProps) {
  const dateLabel = format(date, "M월 d일 EEEE", { locale: ko });

  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "flex w-full items-center justify-between gap-3 border-b border-border py-3 text-left",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="typo-body-strong text-text-strong">{dateLabel}</span>
        <span className="typo-caption text-text">
          {scheduledStart} - {scheduledEnd}
        </span>
        {changeNote ? <span className="typo-caption text-action">{changeNote}</span> : null}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="typo-label text-text">{position}</span>
        <span className="typo-caption text-text">{status}</span>
      </div>
    </button>
  );
}
