"use client";

import {
  useRoleAction,
  type RoleActionOutcome,
} from "@/features/role-management/hooks/useRoleActions";
import { Button } from "@/shared/ui/button";

type RoleActionButtonsProps = {
  isAdmin: boolean;
  onGrant: () => Promise<RoleActionOutcome>;
  onRevoke: () => Promise<RoleActionOutcome>;
};

export function RoleActionButtons({ isAdmin, onGrant, onRevoke }: RoleActionButtonsProps) {
  const grant = useRoleAction(onGrant);
  const revoke = useRoleAction(onRevoke);

  if (isAdmin) {
    return (
      <form action={revoke.formAction}>
        <Button type="submit" variant="secondary" disabled={revoke.pending}>
          해제
        </Button>
      </form>
    );
  }

  return (
    <form action={grant.formAction}>
      <Button type="submit" disabled={grant.pending}>
        임명
      </Button>
    </form>
  );
}
