import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { CountdownState } from "@/views/home/model/countdown";
import { formatCountdownClock } from "@/views/home/model/countdown";
import type { TodayShift } from "@/views/home/model/home-view-model";
import { FailedRow } from "@/views/home/ui/FailedRow";

type TodayBlockProps = {
  status: "filled" | "failed";
  shift: TodayShift | null;
  todayLabel: string;
  countdown: CountdownState | null;
  windowOpensAtLabel: string | null;
};

function clockCaption(
  countdown: CountdownState,
  action: TodayShift["attendanceWindow"]["action"],
  windowOpensAtLabel: string | null,
): string {
  switch (countdown.phase) {
    case "before-window":
      return `${windowOpensAtLabel}부터 인증 가능`;
    case "open":
      return action === "check-in" ? "출근 시각까지" : "퇴근 시각까지";
    case "overdue":
      return action === "check-in" ? "출근 시각에서 지남" : "퇴근 시각에서 지남";
  }
}

function attendanceLabel(action: TodayShift["attendanceWindow"]["action"]): string {
  return action === "check-in" ? "출근 인증하기" : "퇴근 인증하기";
}

export function TodayBlock({
  status,
  shift,
  todayLabel,
  countdown,
  windowOpensAtLabel,
}: TodayBlockProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 pb-1.5 typo-caption-strong text-text-muted">오늘 · {todayLabel}</p>

      {status === "failed" || shift === null || countdown === null ? (
        <div className="rounded-xl bg-surface px-4 py-1">
          <FailedRow message="오늘 근무를 불러오지 못했어요" />
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p
                className={cn(
                  "typo-headline-lg tabular-nums",
                  countdown.phase === "before-window" ? "text-text-muted" : "text-text-strong",
                )}
              >
                {formatCountdownClock(countdown)}
              </p>
              <p className="typo-caption text-text-muted">
                {clockCaption(countdown, shift.attendanceWindow.action, windowOpensAtLabel)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <p className="typo-body text-text-strong">{shift.position}</p>
              <p className="typo-caption text-text-muted">
                {shift.startTime} ~ {shift.endTime}
              </p>
            </div>
          </div>

          <Link
            href={`/schedule/${shift.date}`}
            transitionTypes={["nav-forward"]}
            className="flex items-center gap-2 border-t border-border pt-2.5 transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-[0.985]"
          >
            <span aria-hidden className="flex shrink-0">
              <span className="size-5.5 rounded-pill border-2 border-surface bg-neutral-border" />
              <span className="-ml-2 size-5.5 rounded-pill border-2 border-surface bg-neutral-border" />
              <span className="-ml-2 size-5.5 rounded-pill border-2 border-surface bg-neutral-border" />
              <span className="-ml-2 size-5.5 rounded-pill border-2 border-surface bg-neutral-border" />
            </span>
            <span className="flex-1 typo-caption text-text-muted">
              {shift.headcount}명 · 예식 {shift.ceremonyTime} · 포지션 보기
            </span>
            <ChevronRight aria-hidden className="size-5 shrink-0 text-text-weak" />
          </Link>

          <Button
            type="button"
            variant="primary"
            disabled={countdown.phase === "before-window"}
            className="mt-1"
          >
            {attendanceLabel(shift.attendanceWindow.action)}
          </Button>
        </div>
      )}
    </div>
  );
}
