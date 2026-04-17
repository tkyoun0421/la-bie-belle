import { useQuery } from "@tanstack/react-query";
import { getEventAssignmentsQueryOptions } from "#/queries/assignments/options/getEventAssignmentsQueryOptions";

export function useEventAssignmentsQuery(eventId: string) {
  return useQuery(getEventAssignmentsQueryOptions(eventId));
}
