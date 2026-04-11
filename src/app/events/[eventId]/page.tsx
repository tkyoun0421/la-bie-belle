import { notFound } from "next/navigation";
import { readEventById } from "#/entities/events/repositories/readEventRepository";
import { EventDetailScreen } from "#/screens/events/detail/EventDetailScreen";
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
  const event = await readEventById(eventId, { client });

  if (!event) {
    notFound();
  }

  return <EventDetailScreen event={event} />;
}
