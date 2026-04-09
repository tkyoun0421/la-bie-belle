import { ScreenPlaceholder } from "#/shared/components/ScreenPlaceholder";

type EventDetailScreenProps = {
  eventId: string;
};

export function EventDetailScreen({ eventId }: EventDetailScreenProps) {
  return (
    <ScreenPlaceholder
      eyebrow="Event Detail"
      title={`Event ${eventId}`}
      description="Event detail is bootstrapped and waiting for the event template and assignment slices."
    />
  );
}
