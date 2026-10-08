import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getQualifications } from "@/entities/member/api/getQualifications.api";
import type { Qualification } from "@/entities/member/api/member.dto";

export type QualificationsResult = {
  data: Qualification[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useQualificationsQuery(client: DB): QualificationsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.member.qualifications(),
    queryFn: () => getQualifications(client),
  });

  return { data, error, isLoading };
}
