import { useQuery } from "@tanstack/react-query";
import { replacementQueryKeys } from "#/queries/replacements/constants/replacementQueryKeys";
import { fetchReplacements } from "#/queries/replacements/services/fetchReplacements";

export function useReplacementsQuery() {
  return useQuery({
    queryFn: fetchReplacements,
    queryKey: replacementQueryKeys.all,
  });
}
