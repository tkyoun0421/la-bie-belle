import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBulkEventsAction } from "#/mutations/events/actions/createBulkEvents";
import { getEventCollectionQueryOptions } from "#/queries/events/options/getEventCollectionQueryOptions";

export function useCreateBulkEventsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      eventDates: string[];
      templateId: string;
      title: string;
    }) => createBulkEventsAction(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries(getEventCollectionQueryOptions());
    },
  });
}
