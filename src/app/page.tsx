import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getEventCollectionQueryOptions } from "#/queries/events/options/getEventCollectionQueryOptions";
import { readEventCollectionWithApplicationStatus } from "#/queries/events/services/readEventCollectionWithApplicationStatus";
import { DashboardScreen } from "#/screens/dashboard/DashboardScreen";
import { hasPublicSupabaseEnv } from "#/shared/config/env";
import { getCurrentAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const queryClient = createQueryClient();
  const eventCollectionQuery = getEventCollectionQueryOptions();

  if (!hasPublicSupabaseEnv()) {
    queryClient.setQueryData(eventCollectionQuery.queryKey, []);

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardScreen />
      </HydrationBoundary>
    );
  }

  const client = await createSupabaseServerClient();
  const actor = await getCurrentAppActor({ client });
  const events = await readEventCollectionWithApplicationStatus({
    client,
    viewerId: actor?.userId ?? null,
  });

  queryClient.setQueryData(eventCollectionQuery.queryKey, events);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardScreen />
    </HydrationBoundary>
  );
}
