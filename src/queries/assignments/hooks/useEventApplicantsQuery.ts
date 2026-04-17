import { useQuery } from "@tanstack/react-query";
import { getEventApplicantsQueryOptions } from "#/queries/assignments/options/getEventApplicantsQueryOptions";

export function useEventApplicantsQuery(eventId: string) {
  return useQuery(getEventApplicantsQueryOptions(eventId));
}
