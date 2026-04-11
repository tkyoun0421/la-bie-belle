import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventDetail, EventListItem } from "#/entities/events/models/schemas/event";
import { cancelEventApplicationAction } from "#/mutations/applications/actions/cancelEventApplication";
import type { CancelEventApplicationInput } from "#/mutations/applications/schemas/cancelEventApplication";
import { eventQueryKeys } from "#/queries/events/constants/eventQueryKeys";

export function useCancelEventApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CancelEventApplicationInput) =>
      cancelEventApplicationAction(input),
    onSuccess(result) {
      queryClient.setQueryData<EventListItem[]>(
        eventQueryKeys.collection(),
        (currentEvents = []) =>
          currentEvents.map((event) =>
            event.id === result.eventId
              ? {
                  ...event,
                  viewerApplicationStatus: "cancelled",
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
                viewerApplicationStatus: "cancelled",
              }
            : currentEvent
      );
    },
  });
}
