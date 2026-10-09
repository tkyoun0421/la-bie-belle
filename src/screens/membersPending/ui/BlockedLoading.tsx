import { Card } from "@/shared/ui/Card";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { BLOCKED_SKELETON_ROWS } from "@/screens/membersPending/consts/membersPending.const";

export function BlockedLoading() {
  return (
    <Card>
      {BLOCKED_SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="my-4 w-2/3" />
      ))}
    </Card>
  );
}
