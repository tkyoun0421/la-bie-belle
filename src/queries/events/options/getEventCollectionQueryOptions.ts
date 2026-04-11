import { queryOptions } from "@tanstack/react-query";
import { eventQueryKeys } from "#/queries/events/constants/eventQueryKeys";
import { fetchEvents } from "#/queries/events/services/fetchEvents";

export function getEventCollectionQueryOptions() {
  return queryOptions({
    queryKey: eventQueryKeys.collection(),
    queryFn: fetchEvents,
  });
}
