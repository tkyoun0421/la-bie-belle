import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { eventTemplateQueryKeys } from "#/queries/events/models/constants/eventTemplateQueryKeys";
import { readEventTemplates } from "#/queries/events/models/repositories/eventTemplateRepository";
import { positionQueryKeys } from "#/queries/positions/models/constants/positionQueryKeys";
import { readPositions } from "#/queries/positions/models/repositories/positionRepository";
import { AdminTemplatesScreen } from "#/flows/admin/templates/AdminTemplatesScreen";
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
