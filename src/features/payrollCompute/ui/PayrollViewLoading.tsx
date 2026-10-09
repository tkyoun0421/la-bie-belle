import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SKELETON_ROWS } from "@/features/payrollCompute/consts/payrollCompute.const";

export function PayrollViewLoading() {
  return (
    <>
      {SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="my-4 w-2/3" />
      ))}
    </>
  );
}
