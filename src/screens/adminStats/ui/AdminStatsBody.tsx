import type { AdminStatsScreenController } from "@/screens/adminStats/hooks/useAdminStatsScreen";
import { AdminStatsAttendance } from "@/screens/adminStats/ui/AdminStatsAttendance";
import { AdminStatsEmpty } from "@/screens/adminStats/ui/AdminStatsEmpty";
import { AdminStatsFailed } from "@/screens/adminStats/ui/AdminStatsFailed";
import { AdminStatsLoading } from "@/screens/adminStats/ui/AdminStatsLoading";
import { AdminStatsWork } from "@/screens/adminStats/ui/AdminStatsWork";

export type AdminStatsBodyProps = {
  screen: AdminStatsScreenController;
};

export function AdminStatsBody({ screen }: AdminStatsBodyProps) {
  return (
    <>
      {screen.listState === "loading" ? <AdminStatsLoading /> : null}

      {screen.listState === "failed" ? (
        <AdminStatsFailed onRetry={screen.retry} />
      ) : null}

      {screen.listState === "empty" ? (
        <AdminStatsEmpty total={screen.emptyTotal} />
      ) : null}

      {screen.listState === "work" ? (
        <AdminStatsWork
          totalLabel={screen.totalLabel}
          countLine={screen.countLine}
          peopleRows={screen.peopleRows}
          positionRows={screen.positionRows}
        />
      ) : null}

      {screen.listState === "attendance" ? (
        <AdminStatsAttendance
          attendanceLine={screen.attendanceLine}
          shares={screen.shares}
          rows={screen.attendanceRows}
        />
      ) : null}
    </>
  );
}
