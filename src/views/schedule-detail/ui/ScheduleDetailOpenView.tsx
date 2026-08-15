import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type ScheduleDetailOpenViewProps = {
  workDate: string;
};

export function ScheduleDetailOpenView({ workDate }: ScheduleDetailOpenViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6">
      <header className="flex items-center gap-2">
        <Button asChild variant="icon" aria-label="뒤로 가기">
          <Link href="/schedule" transitionTypes={["nav-back"]}>
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
        </Button>
        <h1 className="typo-title text-text-strong">모집 중</h1>
      </header>

      <section className="flex flex-col gap-2">
        <p className="typo-caption text-text">{workDate}</p>
        <Badge tone="neutral">모집 중</Badge>
      </section>

      <p className="typo-body text-text">
        아직 모집 중인 스케줄이에요. 배정이 확정되면 배정표를 볼 수 있어요.
      </p>
    </main>
  );
}
