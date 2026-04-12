import { notFound } from "next/navigation";
import { readEventDetailWithApplicationStatus } from "#/queries/events/services/readEventDetailWithApplicationStatus";
import { EventDetailScreen } from "#/screens/events/detail/EventDetailScreen";
import { getCurrentAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { eventId } = await params;
  const client = await createSupabaseServerClient();
  const actor = await getCurrentAppActor({ client });
  const event = await readEventDetailWithApplicationStatus({
    client,
    eventId,
    viewerId: actor?.userId ?? null,
  });

  if (!event) {
    notFound();
  }

  return <EventDetailScreen event={event} />;
}
