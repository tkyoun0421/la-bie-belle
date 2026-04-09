import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { positionQueryKeys } from "#/queries/positions/models/constants/positionQueryKeys";
import { readPositions } from "#/queries/positions/models/repositories/positionRepository";
import { AdminPositionsScreen } from "#/flows/admin/positions/AdminPositionsScreen";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function AdminPositionsPage() {
  const positions = await readPositions();
  const queryClient = createQueryClient();
  queryClient.setQueryData(positionQueryKeys.collection(), positions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminPositionsScreen initialPositionCount={positions.length} />
    </HydrationBoundary>
  );
}
