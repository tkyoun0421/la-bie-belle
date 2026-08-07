import { findWorkerDetail } from "@/entities/identity/api/find-worker-detail";
import { grantPosition } from "@/features/worker-management/api/grant-position";
import { revokePosition } from "@/features/worker-management/api/revoke-position";
import { setHourlyWage } from "@/features/worker-management/api/set-hourly-wage";
import { updateWorkerInfo } from "@/features/worker-management/api/update-worker-info";
import { WorkerDetailView } from "@/views/admin/ui/WorkerDetailView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";
import { NotFoundScreen } from "@/views/status/ui/NotFoundScreen";

type AdminWorkerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminWorkerDetailPage({ params }: AdminWorkerDetailPageProps) {
  const { id } = await params;
  const workerResult = await findWorkerDetail(id);

  if (!workerResult.ok) {
    return <ErrorScreen />;
  }

  if (workerResult.data === null) {
    return <NotFoundScreen />;
  }

  return (
    <WorkerDetailView
      worker={workerResult.data}
      onUpdateInfo={updateWorkerInfo}
      onSetWage={setHourlyWage}
      onGrant={grantPosition}
      onRevoke={revokePosition}
    />
  );
}
