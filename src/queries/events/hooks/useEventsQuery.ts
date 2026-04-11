import { useQuery } from "@tanstack/react-query";
import { getEventCollectionQueryOptions } from "#/queries/events/options/getEventCollectionQueryOptions";

export function useEventsQuery() {
  return useQuery(getEventCollectionQueryOptions());
}
