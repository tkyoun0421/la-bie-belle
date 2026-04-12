"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { canWriteEventApplication } from "#/entities/events/models/policies/eventApplicationPolicy";
import type {
  EventListItem,
  EventStatus,
} from "#/entities/events/models/schemas/event";
import { useDashboardCalendarState } from "#/screens/dashboard/_hooks/useDashboardCalendarState";
import { Alert, AlertDescription, AlertTitle } from "#/shared/components/ui/alert";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import { Calendar } from "#/shared/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";

const eventStatusCopy: Record<EventStatus, string> = {
  cancelled: "취소됨",
  completed: "종료됨",
  draft: "초안",
  in_progress: "진행 중",
  recruiting: "모집 중",
  staffed: "배정 완료",
};

function formatSelectedDate(value: string) {
  return format(parseISO(`${value}T00:00:00`), "M월 d일 (EEE)", {
    locale: ko,
  });
}

function readSelectedDateTitle(selectedDates: string[]) {
  if (selectedDates.length === 0) {
    return "열린 날짜를 선택해 주세요";
  }

  if (selectedDates.length === 1) {
    return formatSelectedDate(selectedDates[0]);
  }

  return `선택한 날짜 ${selectedDates.length}일`;
}

function readApplicationButtonLabel(event: EventListItem) {
  if (!canWriteEventApplication(event.status)) {
    return "모집 종료";
  }

  return event.viewerApplicationStatus === "applied" ? "신청 취소" : "신청";
}

function readApplicationBadgeLabel(event: EventListItem) {
  if (event.viewerApplicationStatus === "applied") {
    return "신청됨";
  }

  if (event.viewerApplicationStatus === "cancelled") {
    return "취소됨";
  }

  return "미신청";
}

export function DashboardClient() {
  const {
    applyToSelectedDates,
    bulkApplicableCount,
    bulkCancellableCount,
    cancelSelectedDateApplications,
    changeVisibleMonth,
    events,
    eventsByDate,
    eventsQuery,
    pendingEventId,
    selectDates,
    selectedDates,
    selectedEvents,
    selectableDates,
    toggleEventApplication,
    visibleMonth,
    writeError,
  } = useDashboardCalendarState();
  const eventDates = selectableDates.map(
    (value) => new Date(`${value}T00:00:00`)
  );
  const appliedDates = Object.entries(eventsByDate)
    .filter(([, dayEvents]) =>
      dayEvents.some((event) => event.viewerApplicationStatus === "applied")
    )
    .map(([value]) => new Date(`${value}T00:00:00`));
  const selectableDateSet = new Set(selectableDates);

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Card className="border border-border/70 bg-background/92">
        <CardHeader>
          <div>
            <CardTitle>행사 달력</CardTitle>
            <CardDescription>
              열린 스케줄이 있는 날짜를 여러 개 선택하고, 해당 날짜의 행사에
              한 번에 신청하거나 취소할 수 있습니다.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Calendar
            className="rounded-[28px] border border-border/60 bg-muted/10"
            disabled={(date) =>
              !selectableDateSet.has(format(date, "yyyy-MM-dd"))
            }
            locale={ko}
            mode="multiple"
            modifiers={{
              hasApplied: appliedDates,
              hasEvents: eventDates,
            }}
            modifiersClassNames={{
              hasApplied:
                "rounded-2xl ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,transparent)]",
              hasEvents:
                "rounded-2xl bg-[color-mix(in_srgb,var(--primary)_5%,white)]",
            }}
            month={parseISO(`${visibleMonth}-01T00:00:00`)}
            onMonthChange={changeVisibleMonth}
            onSelect={(nextDates) => {
              selectDates(
                (nextDates ?? []).map((date) => format(date, "yyyy-MM-dd"))
              );
            }}
            selected={selectedDates.map(
              (value) => new Date(`${value}T00:00:00`)
            )}
          />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">배경 강조: 열린 스케줄 있음</Badge>
            <Badge variant="outline">링 강조: 신청 있음</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-background/92">
        <CardHeader>
          <CardTitle>{readSelectedDateTitle(selectedDates)}</CardTitle>
          <CardDescription>
            선택한 날짜에 포함된 열린 스케줄만 신청하거나 취소할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {eventsQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>행사 목록을 불러올 수 없습니다</AlertTitle>
              <AlertDescription>
                화면을 새로고침한 뒤 다시 확인해 주세요.
              </AlertDescription>
            </Alert>
          ) : null}

          {writeError ? (
            <Alert variant="destructive">
              <AlertTitle>신청 상태를 변경할 수 없습니다</AlertTitle>
              <AlertDescription>{writeError}</AlertDescription>
            </Alert>
          ) : null}

          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-5 py-8 text-center">
              <p className="text-base font-semibold text-foreground">
                아직 등록된 행사가 없습니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                먼저 달력에 표시할 첫 행사를 만들면 멤버 신청 흐름이 여기서
                시작됩니다.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/admin/templates">템플릿에서 첫 행사 만들기</Link>
              </Button>
            </div>
          ) : selectedDates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center">
              <p className="text-base font-semibold text-foreground">
                신청할 열린 날짜를 달력에서 선택해 주세요.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                여러 날짜를 골라 해당 날짜의 열린 스케줄에 한 번에 신청하거나
                취소할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date) => (
                  <Badge key={date} variant="outline">
                    {formatSelectedDate(date)}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={bulkApplicableCount === 0 || pendingEventId !== null}
                  onClick={() => void applyToSelectedDates()}
                  size="sm"
                  type="button"
                >
                  {bulkApplicableCount > 0
                    ? `선택한 날짜의 열린 스케줄 모두 신청 (${bulkApplicableCount})`
                    : "신청 가능한 행사 없음"}
                </Button>
                <Button
                  disabled={bulkCancellableCount === 0 || pendingEventId !== null}
                  onClick={() => void cancelSelectedDateApplications()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {bulkCancellableCount > 0
                    ? `선택한 날짜의 신청 모두 취소 (${bulkCancellableCount})`
                    : "취소 가능한 신청 없음"}
                </Button>
              </div>

              {selectedEvents.length > 0 ? (
                <ul className="grid gap-3">
                  {selectedEvents.map((event) => (
                    <li
                      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4"
                      key={event.id}
                    >
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-foreground">
                            {event.title}
                          </p>
                          <Badge variant="secondary">
                            {eventStatusCopy[event.status]}
                          </Badge>
                          <Badge variant="outline">
                            {readApplicationBadgeLabel(event)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>{formatSelectedDate(event.eventDate)}</span>
                          <span>{event.timeLabel}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={
                            pendingEventId === event.id ||
                            !canWriteEventApplication(event.status)
                          }
                          onClick={() => void toggleEventApplication(event)}
                          size="sm"
                          type="button"
                        >
                          {pendingEventId === event.id
                            ? "처리 중..."
                            : readApplicationButtonLabel(event)}
                        </Button>
                        <Button asChild size="sm" type="button" variant="outline">
                          <Link href={`/events/${event.id}`}>상세 보기</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center">
                  <p className="text-base font-semibold text-foreground">
                    선택한 날짜에는 처리할 열린 스케줄이 없습니다.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    다른 열린 날짜를 골라 다시 확인해 주세요.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
