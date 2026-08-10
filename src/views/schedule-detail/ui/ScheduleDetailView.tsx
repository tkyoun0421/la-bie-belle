import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import type { ScheduleConfirmation } from "@/entities/schedule/model/confirmation";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

type ScheduleDetailViewProps = {
  confirmation: ScheduleConfirmation;
};

export function ScheduleDetailView({ confirmation }: ScheduleDetailViewProps) {
  const myAssignment = confirmation.roster.find((row) => row.isMe);

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6">
      <header className="flex items-center gap-2">
        <Button asChild variant="icon" aria-label="뒤로 가기">
          <Link href="/schedule">
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
        </Button>
        <h1 className="typo-title text-text-strong">확정 스케줄</h1>
      </header>

      {confirmation.changeSummary ? (
        <p className="typo-body-strong text-action">{confirmation.changeSummary}</p>
      ) : null}

      <section className="flex flex-col gap-1">
        <p className="typo-caption text-text">{confirmation.date}</p>
        <p className="typo-headline-md text-text-strong tabular-nums">
          {confirmation.scheduledStart} - {confirmation.scheduledEnd}
        </p>
      </section>

      {myAssignment ? (
        <section className="flex flex-col gap-1">
          <h2 className="typo-label text-text">내 배정</h2>
          <p className="typo-body text-text-strong">{myAssignment.positions.join(", ")}</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="typo-label text-text">전체 배정표</h2>
        <ul className="flex flex-col">
          {confirmation.roster.map((row, index) => (
            <li
              key={`${row.name}-${index}`}
              className={cn(
                "flex motion-stagger-item items-center justify-between gap-2 border-b border-border py-2",
                row.isMe && "rounded-md bg-action-surface px-2",
              )}
              style={{ "--stagger-index": index } as CSSProperties}
            >
              <span className={cn("typo-body", row.isMe ? "text-action" : "text-text-strong")}>
                {row.isMe ? "나" : row.name}
              </span>
              <span className="flex flex-wrap items-center justify-end gap-1">
                {row.isTrainee ? (
                  <>
                    <span className="typo-caption text-text">{row.positions.join(", ")}</span>
                    <Badge tone="neutral">교육</Badge>
                  </>
                ) : (
                  row.positions.map((position) => (
                    <Badge key={position} tone="action">
                      {position}
                    </Badge>
                  ))
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="typo-label text-text">예식 시간</h2>
        <p className="typo-body text-text-strong tabular-nums">{confirmation.ceremonyTime}</p>
      </section>

      <Button variant="secondary" disabled disabledReason="다음 라운드에서 제공돼요">
        근무 변경 요청
      </Button>
    </main>
  );
}
