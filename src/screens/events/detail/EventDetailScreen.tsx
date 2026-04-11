import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type {
  EventDetail,
  EventStatus,
} from "#/entities/events/models/schemas/event";
import { EventApplicationPanel } from "#/screens/events/detail/_components/EventApplicationPanel";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";

type EventDetailScreenProps = {
  event: EventDetail;
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
  return format(parseISO(`${value}T00:00:00`), "yyyy년 M월 d일 (EEE)", {
    locale: ko,
  });
}

export function EventDetailScreen({
  event,
}: Readonly<EventDetailScreenProps>) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_52%,#d97706_100%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100">
          Event Detail
        </p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              {event.title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
              생성된 행사 기본 정보와 템플릿에서 복사된 포지션 슬롯을
              확인합니다. 신청, 배정, 대타 흐름은 다음 slice에서 이 화면을
              기준으로 이어집니다.
            </p>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/">대시보드로 이동</Link>
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge className="bg-white/16 text-white hover:bg-white/16">
            {eventStatusCopy[event.status]}
          </Badge>
          <Badge
            className="border-white/20 bg-white/8 text-white hover:bg-white/8"
            variant="outline"
          >
            {formatEventDate(event.eventDate)}
          </Badge>
          <Badge
            className="border-white/20 bg-white/8 text-white hover:bg-white/8"
            variant="outline"
          >
            {event.timeLabel}
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="border border-border/70 bg-background/92">
          <CardHeader>
            <CardTitle>행사 메타데이터</CardTitle>
            <CardDescription>
              다음 slice에서 신청/배정/체크인 기준이 될 최소 detail read model
              입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  행사 날짜
                </dt>
                <dd className="mt-2 text-base font-semibold text-foreground">
                  {formatEventDate(event.eventDate)}
                </dd>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  서비스 시간
                </dt>
                <dd className="mt-2 text-base font-semibold text-foreground">
                  {event.firstServiceAt} - {event.lastServiceEndAt}
                </dd>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  상태
                </dt>
                <dd className="mt-2 text-base font-semibold text-foreground">
                  {eventStatusCopy[event.status]}
                </dd>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  템플릿 연결
                </dt>
                <dd className="mt-2 break-all text-sm font-medium text-foreground">
                  {event.templateId ?? "직접 생성된 행사"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-background/92">
          <CardHeader>
            <CardTitle>복사된 포지션 슬롯</CardTitle>
            <CardDescription>
              행사 생성 시 템플릿 기본값이 `event_position_slots`로 복사된
              결과입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {event.positionSlots.length > 0 ? (
              <ul className="space-y-3">
                {event.positionSlots.map((slot) => (
                  <li
                    key={slot.positionId}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {slot.positionName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        정규 {slot.requiredCount}명
                      </p>
                    </div>
                    <Badge variant="secondary">
                      교육 {slot.trainingCount}명
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-sm leading-6 text-muted-foreground">
                이 행사에는 아직 표시할 포지션 슬롯 정보가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <EventApplicationPanel
        eventId={event.id}
        eventStatus={event.status}
        initialApplicationStatus={event.viewerApplicationStatus}
      />

      <Card className="border border-dashed border-border/70 bg-background/92">
        <CardHeader>
          <CardTitle>다음 연결 지점</CardTitle>
          <CardDescription>
            Slice 3과 Slice 4에서 이 detail 화면에 신청 상태와 배정 결과가
            붙습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="font-semibold text-foreground">신청 상태</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              멤버 신청/취소 상태와 모집 가능 여부가 이 영역에 표시될 예정입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="font-semibold text-foreground">배정 상태</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              포지션별 배정 결과, 중복 경고, 대타 연결 포인트가 여기서 열립니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
