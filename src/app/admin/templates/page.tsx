import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { readEventTemplates } from "#/entities/events/repositories/eventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/positionRepository";
import { getEventTemplateCollectionQueryOptions } from "#/queries/events/options/getEventTemplateCollectionQueryOptions";
import { getPositionCollectionQueryOptions } from "#/queries/positions/options/getPositionCollectionQueryOptions";
import { AdminTemplatesScreen } from "#/screens/admin/templates/AdminTemplatesScreen";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const [templates, positions] = await Promise.all([
    readEventTemplates(),
    readPositions(),
  ]);
  const queryClient = createQueryClient();
  const eventTemplateCollectionQuery =
    getEventTemplateCollectionQueryOptions();
  const positionCollectionQuery = getPositionCollectionQueryOptions();

  queryClient.setQueryData(eventTemplateCollectionQuery.queryKey, templates);
  queryClient.setQueryData(positionCollectionQuery.queryKey, positions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminTemplatesScreen initialTemplateCount={templates.length} />
    </HydrationBoundary>
  );
}
