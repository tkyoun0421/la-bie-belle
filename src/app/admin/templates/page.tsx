import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { readEventTemplates } from "#/entities/events/repositories/readEventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/readPositionRepository";
import { getEventTemplateCollectionQueryOptions } from "#/queries/events/options/getEventTemplateCollectionQueryOptions";
import { getPositionCollectionQueryOptions } from "#/queries/positions/options/getPositionCollectionQueryOptions";
import { AdminTemplatesScreen } from "#/screens/admin/templates/AdminTemplatesScreen";
import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  await requireAdminPageActor();
  const client = createSupabaseAdminClient();
  const [templates, positions] = await Promise.all([
    readEventTemplates({ client }),
    readPositions({ client }),
  ]);
  const queryClient = createQueryClient();
  const eventTemplateCollectionQuery =
    getEventTemplateCollectionQueryOptions();
  const positionCollectionQuery = getPositionCollectionQueryOptions();

  queryClient.setQueryData(eventTemplateCollectionQuery.queryKey, templates);
  queryClient.setQueryData(positionCollectionQuery.queryKey, positions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminTemplatesScreen />
    </HydrationBoundary>
  );
}
