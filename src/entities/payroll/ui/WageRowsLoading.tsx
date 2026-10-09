import { SkeletonLine } from "@/shared/ui/Skeleton";
import { WAGE_ROWS_SKELETON } from "@/entities/payroll/consts/wageRows.const";

export function WageRowsLoading() {
  return (
    <>
      {WAGE_ROWS_SKELETON.map((at) => (
        <SkeletonLine key={at} className="my-4 w-2/3" />
      ))}
    </>
  );
}
