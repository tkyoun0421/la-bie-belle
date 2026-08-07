import { resolveEffectiveWage } from "@/entities/identity/model/wage";
import type { WorkerDetail } from "@/entities/identity/types/worker";
import type { HourlyWageOutcome } from "@/features/worker-management/hooks/useHourlyWageForm";
import type { PositionActionOutcome } from "@/features/worker-management/hooks/usePositionAction";
import type {
  WorkerInfoActionInput,
  WorkerInfoOutcome,
} from "@/features/worker-management/hooks/useWorkerInfoForm";
import type { WorkerStatusActionOutcome } from "@/features/worker-management/hooks/useWorkerStatusAction";
import { HourlyWageForm } from "@/features/worker-management/ui/HourlyWageForm";
import { PositionToggleList } from "@/features/worker-management/ui/PositionToggleList";
import { WorkerInfoForm } from "@/features/worker-management/ui/WorkerInfoForm";
import { WorkerStatusAction } from "@/features/worker-management/ui/WorkerStatusAction";
import { Badge } from "@/shared/ui/badge";
import { profileStatusLabel } from "@/views/admin/model/profile-status-label";

type WorkerDetailViewProps = {
  worker: WorkerDetail;
  onUpdateInfo: (
    targetProfileId: string,
    input: WorkerInfoActionInput,
  ) => Promise<WorkerInfoOutcome>;
  onSetWage: (targetProfileId: string, hourlyWage: number) => Promise<HourlyWageOutcome>;
  onGrant: (targetProfileId: string, positionId: string) => Promise<PositionActionOutcome>;
  onRevoke: (targetProfileId: string, positionId: string) => Promise<PositionActionOutcome>;
  onDeactivate: (targetProfileId: string) => Promise<WorkerStatusActionOutcome>;
  onReactivate: (targetProfileId: string) => Promise<WorkerStatusActionOutcome>;
};

export function WorkerDetailView({
  worker,
  onUpdateInfo,
  onSetWage,
  onGrant,
  onRevoke,
  onDeactivate,
  onReactivate,
}: WorkerDetailViewProps) {
  const effectiveWage = resolveEffectiveWage(worker.hourlyWage, worker.defaultHourlyWage);

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-24">
      <div className="flex items-center justify-between gap-2">
        <h1 className="typo-display text-text-strong">{worker.name}</h1>
        <div className="flex items-center gap-2">
          <Badge tone={worker.status === "active" ? "success" : "neutral"}>
            {profileStatusLabel(worker.status)}
          </Badge>
          <WorkerStatusAction
            status={worker.status}
            onDeactivate={onDeactivate.bind(null, worker.id)}
            onReactivate={onReactivate.bind(null, worker.id)}
          />
        </div>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="typo-title text-text-strong">개인정보</h2>
        <WorkerInfoForm
          action={onUpdateInfo.bind(null, worker.id)}
          initialValues={{
            name: worker.name,
            phone: worker.phone,
            gender: worker.gender,
            birthDate: worker.birthDate,
          }}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="typo-title text-text-strong">시급</h2>
        <HourlyWageForm
          action={onSetWage.bind(null, worker.id)}
          initialAmount={effectiveWage.amount}
          isDerived={effectiveWage.isDerived}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="typo-title text-text-strong">가능 포지션</h2>
        <PositionToggleList
          positions={worker.positions}
          onGrant={onGrant.bind(null, worker.id)}
          onRevoke={onRevoke.bind(null, worker.id)}
        />
      </section>
    </main>
  );
}
