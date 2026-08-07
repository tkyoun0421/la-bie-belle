"use client";

import {
  useReactivateOwn,
  type ReactivateOutcome,
} from "@/features/reactivation/hooks/useReactivateOwn";
import { Button } from "@/shared/ui/button";

type ReactivateButtonProps = {
  onReactivate: () => Promise<ReactivateOutcome>;
};

export function ReactivateButton({ onReactivate }: ReactivateButtonProps) {
  const { formAction, pending } = useReactivateOwn(onReactivate);

  return (
    <form action={formAction}>
      <Button type="submit" disabled={pending}>
        다시 활동하기
      </Button>
    </form>
  );
}
