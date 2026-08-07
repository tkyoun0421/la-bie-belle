"use client";

import { useState } from "react";

import {
  useHourlyWageForm,
  type HourlyWageOutcome,
} from "@/features/worker-management/hooks/useHourlyWageForm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type HourlyWageFormProps = {
  action: (hourlyWage: number) => Promise<HourlyWageOutcome>;
  initialAmount: number;
  isDerived: boolean;
};

export function HourlyWageForm({ action, initialAmount, isDerived }: HourlyWageFormProps) {
  const { state, formAction, pending } = useHourlyWageForm(action);
  const [hourlyWage, setHourlyWage] = useState(String(initialAmount));
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
