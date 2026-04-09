import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { readPositions } from "#/entities/positions/repositories/positionRepository";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";
import { AdminPositionsScreen } from "#/screens/admin/positions/AdminPositionsScreen";
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
