import { Card } from "@/shared/ui/Card";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SKELETON_ROWS } from "@/screens/applications/consts/applications.const";

export function ApplicationsLoading() {
  return (
    <Card>
      {SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="my-4 w-2/3" />
      ))}
    </Card>
  );
}
