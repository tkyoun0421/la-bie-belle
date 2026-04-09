import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { readEventTemplates } from "#/entities/events/repositories/eventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/positionRepository";
import { eventTemplateQueryKeys } from "#/queries/events/constants/eventTemplateQueryKeys";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";
import { AdminTemplatesScreen } from "#/screens/admin/templates/AdminTemplatesScreen";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const [templates, positions] = await Promise.all([
    readEventTemplates(),
    readPositions(),
  ]);
  const queryClient = createQueryClient();
  queryClient.setQueryData(eventTemplateQueryKeys.collection(), templates);
  queryClient.setQueryData(positionQueryKeys.collection(), positions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminTemplatesScreen initialTemplateCount={templates.length} />
    </HydrationBoundary>
  );
}
