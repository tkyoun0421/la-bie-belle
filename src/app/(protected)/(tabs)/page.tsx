import { findImminentRecruitment } from "@/entities/schedule/api/find-imminent-recruitment";
import { RouteTransition } from "@/shared/ui/route-transition";
import { deriveHomePriority } from "@/views/home/model/home-priority";
import { selectImminentRecruitment } from "@/views/home/model/imminent-recruitment";
import { HomeView } from "@/views/home/ui/HomeView";

const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

function seoulToday(): string {
  return SEOUL_DATE_FORMATTER.format(new Date());
}

export default async function HomePage() {
  const today = seoulToday();
  const candidatesResult = await findImminentRecruitment({ today });
  const imminentRecruitment = candidatesResult.ok
    ? selectImminentRecruitment(candidatesResult.data, today)
    : null;

  const model = deriveHomePriority({
    attendance: null,
    deadlineApplication: imminentRecruitment,
    confirmationChange: null,
    nextShift: null,
  });

  return (
    <RouteTransition>
      <HomeView model={model} />
    </RouteTransition>
  );
}
