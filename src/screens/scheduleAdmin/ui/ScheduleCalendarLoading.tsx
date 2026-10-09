import { Card } from "@/shared/ui/Card";
import { SkeletonLine } from "@/shared/ui/Skeleton";

const SKELETON_ROWS = [0, 1, 2];

export function ScheduleCalendarLoading() {
  return (
    <Card>
      {SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="my-4 w-2/3" />
      ))}
    </Card>
  );
}
