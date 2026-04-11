import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type {
  EventListItem,
  EventStatus,
} from "#/entities/events/models/schemas/event";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";

type DashboardScreenProps = {
  events: EventListItem[];
};

const eventStatusCopy: Record<EventStatus, string> = {
  cancelled: "취소됨",
  completed: "종료됨",
  draft: "초안",
  in_progress: "진행 중",
  recruiting: "모집 중",
  staffed: "배정 완료",
};

function formatEventDate(value: string) {
  return format(parseISO(`${value}T00:00:00`), "M월 d일 (EEE)", {
    locale: ko,
  });
}

export function DashboardScreen({ events }: Readonly<DashboardScreenProps>) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#f4f9ff_0%,#f8fbf7_52%,#fff3e8_100%)] px-6 py-8 shadow-[0_24px_72px_rgba(15,23,42,0.08)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
          Dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              실제 행사 목록을 첫 번째 운영 진입점으로 사용합니다.
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] md:text-base">
              생성된 행사를 날짜 순으로 확인하고 바로 상세 화면으로 이동할 수
              있습니다. 신청과 배정 상태는 다음 slice에서 이 목록 위에 이어집니다.
            </p>
          </div>
          <div className="grid gap-2 rounded-[24px] border border-[var(--border-soft)] bg-white/85 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              등록된 행사
            </span>
            <strong className="text-3xl font-extrabold text-[var(--foreground)]">
              {events.length}
            </strong>
          </div>
        </div>
      </section>

      <Card className="border border-border/70 bg-background/92">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>행사 목록</CardTitle>
            <CardDescription>
              기본 정렬은 행사 날짜와 첫 서비스 시간 기준입니다.
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/admin/templates">템플릿 관리</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <ul className="grid gap-3">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">
                        {event.title}
                      </p>
                      <Badge variant="secondary">
                        {eventStatusCopy[event.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{formatEventDate(event.eventDate)}</span>
                      <span>{event.timeLabel}</span>
                    </div>
                  </div>
                  <Button asChild type="button" variant="outline">
                    <Link href={`/events/${event.id}`}>상세 보기</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-5 py-8 text-center">
              <p className="text-base font-semibold text-foreground">
                아직 등록된 행사가 없습니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                먼저 템플릿을 기준으로 첫 행사를 만들면, 이후 신청과 배정 흐름이
                이 목록에서 시작됩니다.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/admin/templates">템플릿에서 첫 행사 만들기</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
