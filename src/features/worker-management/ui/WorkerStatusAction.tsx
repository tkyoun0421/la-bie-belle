"use client";

import type { ProfileStatus } from "@/entities/identity/model/profile-gate";
import {
  useWorkerStatusAction,
  type WorkerStatusActionOutcome,
} from "@/features/worker-management/hooks/useWorkerStatusAction";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";

type WorkerStatusActionProps = {
  status: ProfileStatus;
  onDeactivate: () => Promise<WorkerStatusActionOutcome>;
  onReactivate: () => Promise<WorkerStatusActionOutcome>;
};

export function WorkerStatusAction({
  status,
  onDeactivate,
  onReactivate,
}: WorkerStatusActionProps) {
  const deactivate = useWorkerStatusAction(onDeactivate);
  const reactivate = useWorkerStatusAction(onReactivate);

  if (status === "active") {
    return (
      <>
        <Button variant="secondary" onClick={deactivate.openDialog} disabled={deactivate.pending}>
          수동 휴면
        </Button>
        <Dialog
          open={deactivate.dialogOpen}
          onOpenChange={deactivate.closeDialog}
          title="이 근무자를 휴면 처리할까요?"
          description="휴면 처리하면 다음 요청부터 이 근무자는 휴면 안내 화면으로 이동하고 업무 기능을 이용할 수 없어요"
          confirmLabel="휴면 처리"
          tone="destructive"
          onConfirm={deactivate.run}
        />
      </>
    );
  }

  if (status === "dormant") {
    return (
      <>
        <Button variant="secondary" onClick={reactivate.openDialog} disabled={reactivate.pending}>
          재활성화
        </Button>
        <Dialog
          open={reactivate.dialogOpen}
          onOpenChange={reactivate.closeDialog}
          title="이 근무자를 재활성화할까요?"
          description="재활성화하면 이 근무자는 즉시 다시 서비스를 이용할 수 있어요"
          confirmLabel="재활성화하기"
          onConfirm={reactivate.run}
        />
      </>
    );
  }

  return null;
}
