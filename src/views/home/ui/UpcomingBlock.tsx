import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { DBadge } from "@/shared/ui/d-badge";
import { toShortDateLabel } from "@/views/home/model/date-labels";
import type { UpcomingShift } from "@/views/home/model/upcoming-shifts";
import { EmptyRow } from "@/views/home/ui/EmptyRow";
import { FailedRow } from "@/views/home/ui/FailedRow";

type UpcomingBlockProps = {
  status: "filled" | "empty" | "failed";
  shifts: readonly UpcomingShift[];
};

export function UpcomingBlock({ status, shifts }: UpcomingBlockProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 pb-1.5 typo-caption-strong text-text-muted">다가오는 근무</p>

      <div className="flex flex-col rounded-xl bg-surface px-4 py-1">
        {status === "failed" ? <FailedRow message="다가오는 근무를 불러오지 못했어요" /> : null}
        {status === "empty" ? <EmptyRow message="다가오는 근무가 없어요" /> : null}
        {status === "filled" ? (
          <div className="flex flex-col divide-y divide-border">
            {shifts.map((shift) => (
              <Link
                key={shift.date}
                href={`/schedule/${shift.date}`}
                transitionTypes={["nav-forward"]}
                className="flex items-center gap-3 py-3 transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-[0.985]"
              >
                <DBadge label={shift.label} tier={shift.tier} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate typo-body-strong text-text-strong tabular-nums">
                    {toShortDateLabel(shift.date)}
                  </span>
                  <span className="block truncate typo-caption text-text-muted">
                    {shift.position} · {shift.startTime} ~ {shift.endTime}
                  </span>
                </span>
                <span className="flex h-8.5 shrink-0 items-center rounded-pill bg-surface-weak px-3 typo-caption text-text-strong transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-[0.94]">
                  확인
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {status === "failed" ? null : (
          <Link
            href="/schedule"
            transitionTypes={["tab"]}
            className="flex items-center justify-center gap-0.5 border-t border-border py-3 typo-body-sm text-text"
          >
            <span>전체 일정 보기</span>
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
