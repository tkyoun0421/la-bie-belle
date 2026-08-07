"use client";

import { useState } from "react";

import { useOwnPhoneForm, type OwnPhoneOutcome } from "@/features/my-profile/hooks/useOwnPhoneForm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type OwnPhoneFormProps = {
  action: (phone: string) => Promise<OwnPhoneOutcome>;
  initialPhone: string;
};

export function OwnPhoneForm({ action, initialPhone }: OwnPhoneFormProps) {
  const { state, formAction, pending } = useOwnPhoneForm(action);
  const [phone, setPhone] = useState(initialPhone);
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="휴대폰 번호"
        name="phone"
        type="tel"
        inputMode="numeric"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={fieldErrors?.phone}
      />
      <Button type="submit" variant="primary" loading={pending} disabled={pending}>
        저장
      </Button>
    </form>
  );
}
