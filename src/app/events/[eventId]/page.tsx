import { EventDetailScreen } from "#/screens/events/detail/EventDetailScreen";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { eventId } = await params;

  return <EventDetailScreen eventId={eventId} />;
}
