import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventDetail, EventListItem } from "#/entities/events/models/schemas/event";
import { applyToEventAction } from "#/mutations/applications/actions/applyToEvent";
import type { ApplyToEventInput } from "#/mutations/applications/schemas/applyToEvent";
import { eventQueryKeys } from "#/queries/events/constants/eventQueryKeys";

export function useApplyToEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApplyToEventInput) => applyToEventAction(input),
    onSuccess(result) {
      queryClient.setQueryData<EventListItem[]>(
        eventQueryKeys.collection(),
        (currentEvents = []) =>
          currentEvents.map((event) =>
            event.id === result.eventId
              ? {
                  ...event,
                  viewerApplicationStatus: "applied",
                }
              : event
          )
      );
      queryClient.setQueryData<EventDetail>(
        eventQueryKeys.detail(result.eventId),
        (currentEvent) =>
          currentEvent
            ? {
                ...currentEvent,
                viewerApplicationStatus: "applied",
              }
            : currentEvent
      );
    },
  });
}
