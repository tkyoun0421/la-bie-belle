import { useQuery } from "@tanstack/react-query";
import { replacementQueryKeys } from "#/queries/replacements/constants/replacementQueryKeys";
import { fetchReplacementApplications } from "#/queries/replacements/services/fetchReplacementApplications";

export function useReplacementApplicationsQuery(requestId: string) {
  return useQuery({
    queryFn: () => fetchReplacementApplications(requestId),
    queryKey: [...replacementQueryKeys.all, requestId, "applications"],
    enabled: !!requestId,
  });
}
