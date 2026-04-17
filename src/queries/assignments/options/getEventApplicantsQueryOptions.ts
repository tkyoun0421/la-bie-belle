import { queryOptions } from "@tanstack/react-query";
import { assignmentQueryKeys } from "#/queries/assignments/constants/assignmentQueryKeys";
import { fetchEventApplicants } from "#/queries/assignments/services/fetchEventApplicants";

export function getEventApplicantsQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: assignmentQueryKeys.collection({ eventId }),
    queryFn: () => fetchEventApplicants(eventId),
  });
}
