import { queryOptions } from "@tanstack/react-query";
import { assignmentQueryKeys } from "#/queries/assignments/constants/assignmentQueryKeys";
import { fetchEventAssignments } from "#/queries/assignments/services/fetchEventAssignments";

export function getEventAssignmentsQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: assignmentQueryKeys.detail(eventId),
    queryFn: () => fetchEventAssignments(eventId),
  });
}
