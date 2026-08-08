import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { OwnApplicationStatus } from "@/entities/schedule/model/recruitment-schedule";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type ScheduleDetailClosedViewProps = {
  workDate: string;
  ownApplicationStatus: OwnApplicationStatus | null;
};

export function ScheduleDetailClosedView({
  workDate,
  ownApplicationStatus,
}: ScheduleDetailClosedViewProps) {
  const applied = ownApplicationStatus === "applied";

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6">
      <header className="flex items-center gap-2">
        <Button asChild variant="icon" aria-label="뒤로 가기">
          <Link href="/schedule">
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
        </Button>
        <h1 className="typo-title text-text-strong">모집 마감</h1>
      </header>

      <section className="flex flex-col gap-2">
        <p className="typo-caption text-text">{workDate}</p>
        <Badge tone="neutral">모집 마감</Badge>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="typo-label text-text">내 신청 상태</h2>
        <p className="typo-body-strong text-text-strong">{applied ? "신청 완료" : "미신청"}</p>
      </section>

      <p className="typo-body text-text">
        {applied
          ? "포지션 배정 확정을 기다리고 있어요. 확정되면 스케줄에서 알려드릴게요."
          : "이 날짜의 모집은 마감됐어요."}
      </p>
    </main>
  );
}
