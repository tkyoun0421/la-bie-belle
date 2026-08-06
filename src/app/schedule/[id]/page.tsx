import { GENERAL_CONFIRMATION } from "@/entities/schedule/model/confirmation.mock";
import { ScheduleDetailView } from "@/views/schedule-detail/ui/ScheduleDetailView";

export default function ScheduleDetailPage() {
  return <ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />;
}
