import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { AdminStatsAttendance } from "@/features/stats/ui/AdminStatsAttendance";
import { AdminStatsWork } from "@/features/stats/ui/AdminStatsWork";
import { SKELETON_ROWS } from "@/screens/adminStats/consts/adminStats.const";
import type { AdminStatsScreenController } from "@/screens/adminStats/hooks/useAdminStatsScreen";
import { AdminStatsEmpty } from "@/screens/adminStats/ui/AdminStatsEmpty";
import { AdminStatsFailed } from "@/screens/adminStats/ui/AdminStatsFailed";

export type AdminStatsBodyProps = {
  screen: AdminStatsScreenController;
};

export function AdminStatsBody({ screen }: AdminStatsBodyProps) {
  if (screen.tab === "work") {
    return (
      <AdminStatsWork
        month={screen.month}
        onPickPerson={screen.pickPerson}
        pending={<SkeletonRows rows={SKELETON_ROWS} frame="headed" />}
        failed={<AdminStatsFailed onRetry={screen.retry} />}
        empty={<AdminStatsEmpty total={screen.emptyTotal} />}
      />
    );
  }

  return (
    <AdminStatsAttendance
      month={screen.month}
      pending={<SkeletonRows rows={SKELETON_ROWS} frame="headed" />}
      failed={<AdminStatsFailed onRetry={screen.retry} />}
      empty={<AdminStatsEmpty total={screen.emptyTotal} />}
    />
  );
}
