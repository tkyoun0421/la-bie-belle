import { Card } from "@/shared/ui/Card";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SKELETON_ROWS } from "@/screens/scheduleWorker/consts/scheduleWorker.const";

export function ScheduleWorkerLoading() {
  return (
    <Card>
      {SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="my-4 w-2/3" />
      ))}
    </Card>
  );
}
