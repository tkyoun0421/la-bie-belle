"use client";

import { useState } from "react";

import { useOwnWageForm, type OwnWageOutcome } from "@/features/my-profile/hooks/useOwnWageForm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type OwnWageFormProps = {
  action: (hourlyWage: number) => Promise<OwnWageOutcome>;
  initialHourlyWage: number | null;
  isDerived: boolean;
};

export function OwnWageForm({ action, initialHourlyWage, isDerived }: OwnWageFormProps) {
  const { state, formAction, pending } = useOwnWageForm(action);
  const [hourlyWage, setHourlyWage] = useState(
    initialHourlyWage === null ? "" : String(initialHourlyWage),
  );
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Input
        label="시급"
        name="hourlyWage"
        type="number"
        inputMode="numeric"
        value={hourlyWage}
        onChange={(event) => setHourlyWage(event.target.value)}
        error={fieldErrors?.hourlyWage}
      />
      {isDerived ? <p className="typo-caption text-text-muted">기본 시급 적용 중</p> : null}
      <Button type="submit" variant="primary" loading={pending} disabled={pending}>
        저장
      </Button>
    </form>
  );
}
