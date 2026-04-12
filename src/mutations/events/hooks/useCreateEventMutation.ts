import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventAction } from "#/mutations/events/actions/createEvent";
import type { CreateEventInput } from "#/mutations/events/schemas/createEvent";
import { eventQueryKeys } from "#/queries/events/constants/eventQueryKeys";

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => createEventAction(input),
    onSuccess(event) {
      queryClient.setQueryData(eventQueryKeys.detail(event.id), event);
      void queryClient.invalidateQueries({
        queryKey: eventQueryKeys.collections(),
      });
    },
  });
}
