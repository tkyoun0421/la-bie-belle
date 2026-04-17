import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { readOpenReplacementRequests } from "#/entities/replacements/repositories/readReplacementRepository";
import { replacementQueryKeys } from "#/queries/replacements/constants/replacementQueryKeys";
import { ReplacementsScreen } from "#/screens/replacements/ReplacementsScreen";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function ReplacementsPage() {
  const queryClient = createQueryClient();
  const client = await createSupabaseServerClient();
  const replacements = await readOpenReplacementRequests({ client });

  queryClient.setQueryData(replacementQueryKeys.all, replacements);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReplacementsScreen />
    </HydrationBoundary>
  );
}
