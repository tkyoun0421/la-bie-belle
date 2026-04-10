import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { readPositions } from "#/entities/positions/repositories/readPositionRepository";
import { getPositionCollectionQueryOptions } from "#/queries/positions/options/getPositionCollectionQueryOptions";
import { AdminPositionsScreen } from "#/screens/admin/positions/AdminPositionsScreen";
import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function AdminPositionsPage() {
  await requireAdminPageActor();
  const client = createSupabaseAdminClient();
  const positions = await readPositions({ client });
  const queryClient = createQueryClient();
  const positionCollectionQuery = getPositionCollectionQueryOptions();

  queryClient.setQueryData(positionCollectionQuery.queryKey, positions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminPositionsScreen initialPositionCount={positions.length} />
    </HydrationBoundary>
  );
}
