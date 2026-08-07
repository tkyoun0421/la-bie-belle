import { listWorkers } from "@/entities/identity/api/list-workers";
import { ProfileStatusSchema } from "@/entities/identity/model/profile-gate";
import { WorkerListView } from "@/views/admin/ui/WorkerListView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

type AdminWorkersPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminWorkersPage({ searchParams }: AdminWorkersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.q ?? "";
  const statusParsed = ProfileStatusSchema.safeParse(resolvedSearchParams.status);
  const status = statusParsed.success ? statusParsed.data : "active";

  const workersResult = await listWorkers({ search, status });

  if (!workersResult.ok) {
    return <ErrorScreen />;
  }

  return <WorkerListView workers={workersResult.data} search={search} status={status} />;
}
