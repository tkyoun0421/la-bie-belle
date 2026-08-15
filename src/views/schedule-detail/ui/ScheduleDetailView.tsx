import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import type {
  MyRosterPosition,
  PositionRosterGroup,
  RosterMember,
} from "@/views/schedule-detail/model/roster-groups";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

type ScheduleDetailViewProps = {
  workDate: string;
  plannedCheckin: string;
  plannedCheckout: string;
  ceremonyTimes: string[];
  groups: PositionRosterGroup[];
  myPositions: MyRosterPosition[];
};

function RosterMemberRow({ member }: { member: RosterMember }) {
  return (
    <li
      className={cn(
        "flex motion-stagger-item items-center gap-2 border-b border-border py-2",
        member.isSelf && "rounded-md bg-action-surface px-2",
      )}
      style={{ "--stagger-index": member.displayIndex } as CSSProperties}
    >
      <span className={cn("typo-body", member.isSelf ? "text-action" : "text-text-strong")}>
        {member.isSelf ? "나" : member.name}
      </span>
    </li>
  );
}

function TraineeRosterMemberRow({ member }: { member: RosterMember }) {
  return (
    <li
      className={cn(
        "flex motion-stagger-item items-center justify-between gap-2 border-b border-border py-2",
        member.isSelf && "rounded-md bg-action-surface px-2",
      )}
      style={{ "--stagger-index": member.displayIndex } as CSSProperties}
    >
      <span className={cn("typo-body", member.isSelf ? "text-action" : "text-text-strong")}>
        {member.isSelf ? "나" : member.name}
      </span>
      <Badge tone="neutral">교육</Badge>
    </li>
  );
}

export function ScheduleDetailView({
  workDate,
  plannedCheckin,
  plannedCheckout,
  ceremonyTimes,
  groups,
  myPositions,
}: ScheduleDetailViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6">
      <header className="flex items-center gap-2">
        <Button asChild variant="icon" aria-label="뒤로 가기">
          <Link href="/schedule" transitionTypes={["nav-back"]}>
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
        </Button>
        <h1 className="typo-title text-text-strong">확정 스케줄</h1>
      </header>

      <section className="flex flex-col gap-1">
        <p className="typo-caption text-text">{workDate}</p>
        <p className="typo-headline-md text-text-strong tabular-nums">
          {plannedCheckin} - {plannedCheckout}
        </p>
      </section>

      {myPositions.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h2 className="typo-label text-text">내 배정</h2>
          <span className="flex flex-wrap items-center gap-1">
            {myPositions.map((position) => (
              <span key={position.positionName} className="flex items-center gap-1">
                <Badge tone="action">{position.positionName}</Badge>
                {position.isTrainee ? <Badge tone="neutral">교육</Badge> : null}
              </span>
            ))}
          </span>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="typo-label text-text">전체 배정표</h2>
        {groups.map((group) => (
          <div key={group.positionName} className="flex flex-col gap-1">
            <h3 className="typo-caption text-text">{group.positionName}</h3>
            <ul className="flex flex-col">
              {group.regular.map((member) => (
                <RosterMemberRow
                  key={`${group.positionName}-regular-${member.name}`}
                  member={member}
                />
              ))}
            </ul>
            {group.trainees.length > 0 ? (
              <ul className="flex flex-col border-t border-border">
                {group.trainees.map((member) => (
                  <TraineeRosterMemberRow
                    key={`${group.positionName}-trainee-${member.name}`}
                    member={member}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="typo-label text-text">예식 시간</h2>
        <ul className="flex flex-col gap-1">
          {ceremonyTimes.map((time) => (
            <li key={time} className="typo-body text-text-strong tabular-nums">
              {time}
            </li>
          ))}
        </ul>
      </section>

      <Button variant="secondary" disabled disabledReason="다음 라운드에서 제공돼요">
        근무 변경 요청
      </Button>
    </main>
  );
}
