import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import {
  applicationErrorCodes,
  applicationErrors,
} from "#/entities/applications/models/errors/applicationError";
import { canWriteEventApplication } from "#/entities/events/models/policies/eventApplicationPolicy";
import type { EventListItem } from "#/entities/events/models/schemas/event";
import { useApplyToEventMutation } from "#/mutations/applications/hooks/useApplyToEventMutation";
import { useCancelEventApplicationMutation } from "#/mutations/applications/hooks/useCancelEventApplicationMutation";
import { useEventsQuery } from "#/queries/events/hooks/useEventsQuery";

const emptyEvents: EventListItem[] = [];

function readInitialVisibleMonth(events: EventListItem[]) {
  const initialDate =
    events.find((event) => canWriteEventApplication(event.status))?.eventDate ??
    events[0]?.eventDate ??
    format(new Date(), "yyyy-MM-dd");

  return format(parseISO(`${initialDate}T00:00:00`), "yyyy-MM");
}

function normalizeSelectedDates(dates: string[]) {
  return Array.from(new Set(dates)).sort((left, right) =>
    left.localeCompare(right)
  );
}

function readApplicationActionErrorMessage(error: unknown) {
  const code = applicationErrors.read(error);

  switch (code) {
    case applicationErrorCodes.applyClosedEvent:
    case applicationErrorCodes.cancelClosedEvent:
      return "지금은 신청 상태를 변경할 수 없는 행사입니다.";
    case applicationErrorCodes.applyEventNotFound:
    case applicationErrorCodes.cancelEventNotFound:
      return "행사를 찾을 수 없습니다. 목록을 새로고침해 주세요.";
    case applicationErrorCodes.cancelTargetMissing:
      return "취소할 신청 기록이 없습니다.";
    default:
      return "신청 상태를 변경할 수 없습니다.";
  }
}

export function useDashboardCalendarState() {
  const eventsQuery = useEventsQuery();
  const applyMutation = useApplyToEventMutation();
  const cancelMutation = useCancelEventApplicationMutation();
  const events = eventsQuery.data ?? emptyEvents;
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    readInitialVisibleMonth(events)
  );

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, EventListItem[]>>((acc, event) => {
      if (!acc[event.eventDate]) {
        acc[event.eventDate] = [];
      }

      acc[event.eventDate]?.push(event);
      return acc;
    }, {});
  }, [events]);
  const selectableDates = useMemo(
    () =>
      Object.entries(eventsByDate)
        .filter(([, dayEvents]) =>
          dayEvents.some((event) => canWriteEventApplication(event.status))
        )
        .map(([date]) => date),
    [eventsByDate]
  );
  const selectableDateSet = useMemo(
    () => new Set(selectableDates),
    [selectableDates]
  );
  const resolvedSelectedDates = normalizeSelectedDates(
    selectedDates.filter((date) => selectableDateSet.has(date))
  );
  const selectedEvents = resolvedSelectedDates
    .flatMap((date) => eventsByDate[date] ?? emptyEvents)
    .filter((event) => canWriteEventApplication(event.status))
    .sort((left, right) => {
      const dateComparison = left.eventDate.localeCompare(right.eventDate);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return left.firstServiceAt.localeCompare(right.firstServiceAt);
    });
  const bulkApplicableEvents = selectedEvents.filter(
    (event) =>
      canWriteEventApplication(event.status) &&
      event.viewerApplicationStatus !== "applied"
  );
  const bulkCancellableEvents = selectedEvents.filter(
    (event) =>
      canWriteEventApplication(event.status) &&
      event.viewerApplicationStatus === "applied"
  );
  const pendingEventId = applyMutation.isPending
    ? applyMutation.variables?.eventId ?? null
    : cancelMutation.isPending
      ? cancelMutation.variables?.eventId ?? null
      : null;
  const writeError = applyMutation.error
    ? readApplicationActionErrorMessage(applyMutation.error)
    : cancelMutation.error
      ? readApplicationActionErrorMessage(cancelMutation.error)
      : null;

  function selectDates(nextDates: string[]) {
    const nextSelection = normalizeSelectedDates(nextDates).filter((date) =>
      selectableDateSet.has(date)
    );

    setSelectedDates(nextSelection);

    if (nextSelection[0]) {
      setVisibleMonth(
        format(parseISO(`${nextSelection[0]}T00:00:00`), "yyyy-MM")
      );
    }
  }

  function changeVisibleMonth(nextMonth: Date) {
    setVisibleMonth(format(nextMonth, "yyyy-MM"));
  }

  async function toggleEventApplication(event: EventListItem) {
    if (!canWriteEventApplication(event.status)) {
      return;
    }

    if (event.viewerApplicationStatus === "applied") {
      await cancelMutation.mutateAsync({ eventId: event.id });
      return;
    }

    await applyMutation.mutateAsync({ eventId: event.id });
  }

  async function applyToSelectedDates() {
    for (const event of bulkApplicableEvents) {
      await applyMutation.mutateAsync({ eventId: event.id });
    }
  }

  async function cancelSelectedDateApplications() {
    for (const event of bulkCancellableEvents) {
      await cancelMutation.mutateAsync({ eventId: event.id });
    }
  }

  return {
    applyToSelectedDates,
    bulkApplicableCount: bulkApplicableEvents.length,
    bulkCancellableCount: bulkCancellableEvents.length,
    cancelSelectedDateApplications,
    changeVisibleMonth,
    events,
    eventsByDate,
    eventsQuery,
    pendingEventId,
    selectDates,
    selectedDates: resolvedSelectedDates,
    selectedEvents,
    selectableDates,
    toggleEventApplication,
    visibleMonth,
    writeError,
  };
}
