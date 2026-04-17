import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { readEvents } from "#/entities/events/repositories/readEventRepository";
import { readEventTemplates } from "#/entities/events/repositories/readEventTemplateRepository";
import { getEventCollectionQueryOptions } from "#/queries/events/options/getEventCollectionQueryOptions";
import { getEventTemplateCollectionQueryOptions } from "#/queries/events/options/getEventTemplateCollectionQueryOptions";
import { AdminEventCreateScreen } from "#/screens/admin/events/new/AdminEventCreateScreen";
import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function AdminEventCreatePage() {
  await requireAdminPageActor();
  const client = createSupabaseAdminClient();
  const [templates, events] = await Promise.all([
    readEventTemplates({ client }),
    readEvents({ client }),
  ]);
  const queryClient = createQueryClient();
  const eventTemplateCollectionQuery =
    getEventTemplateCollectionQueryOptions();
  const eventCollectionQuery = getEventCollectionQueryOptions();

  queryClient.setQueryData(eventTemplateCollectionQuery.queryKey, templates);
  queryClient.setQueryData(eventCollectionQuery.queryKey, events);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminEventCreateScreen />
      </Suspense>
    </HydrationBoundary>
  );
}
