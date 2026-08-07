"use client";

import {
  usePositionAction,
  type PositionActionOutcome,
} from "@/features/worker-management/hooks/usePositionAction";
import { Button } from "@/shared/ui/button";

type PositionToggleButtonProps = {
  granted: boolean;
  onGrant: () => Promise<PositionActionOutcome>;
  onRevoke: () => Promise<PositionActionOutcome>;
};

export function PositionToggleButton({ granted, onGrant, onRevoke }: PositionToggleButtonProps) {
  const grant = usePositionAction(onGrant);
  const revoke = usePositionAction(onRevoke);

  if (granted) {
    return (
      <form action={revoke.formAction}>
        <Button type="submit" variant="secondary" disabled={revoke.pending}>
          회수
        </Button>
      </form>
    );
  }

  return (
    <form action={grant.formAction}>
      <Button type="submit" disabled={grant.pending}>
        부여
      </Button>
    </form>
  );
}
