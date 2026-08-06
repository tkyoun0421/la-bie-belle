"use client";

import { useSignOutAction, type SignOutOutcome } from "@/features/auth/hooks/useSignOutAction";
import { Button } from "@/shared/ui/button";

type SignOutButtonProps = {
  action: () => Promise<SignOutOutcome>;
};

export function SignOutButton({ action }: SignOutButtonProps) {
  const { formAction, pending } = useSignOutAction(action);

  return (
    <form action={formAction}>
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        로그아웃
      </Button>
    </form>
  );
}
