import { AdminStatsAttendance } from "@/features/stats/ui/AdminStatsAttendance";
import { AdminStatsWork } from "@/features/stats/ui/AdminStatsWork";
import type { AdminStatsScreenController } from "@/screens/adminStats/hooks/useAdminStatsScreen";
import { AdminStatsEmpty } from "@/screens/adminStats/ui/AdminStatsEmpty";
import { AdminStatsFailed } from "@/screens/adminStats/ui/AdminStatsFailed";
import { AdminStatsLoading } from "@/screens/adminStats/ui/AdminStatsLoading";

export type AdminStatsBodyProps = {
  screen: AdminStatsScreenController;
};

export function AdminStatsBody({ screen }: AdminStatsBodyProps) {
  if (screen.tab === "work") {
    return (
      <AdminStatsWork
        month={screen.month}
        onPickPerson={screen.pickPerson}
        loading={<AdminStatsLoading />}
        failed={<AdminStatsFailed onRetry={screen.retry} />}
        empty={<AdminStatsEmpty total={screen.emptyTotal} />}
      />
    );
  }

  return (
    <AdminStatsAttendance
      month={screen.month}
      loading={<AdminStatsLoading />}
      failed={<AdminStatsFailed onRetry={screen.retry} />}
      empty={<AdminStatsEmpty total={screen.emptyTotal} />}
    />
  );
}
