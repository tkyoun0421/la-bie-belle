"use client";

import { useState } from "react";

import { GENDER_VALUES, type GenderValue } from "@/entities/identity/model/signup";
import {
  useWorkerInfoForm,
  type WorkerInfoActionInput,
  type WorkerInfoOutcome,
} from "@/features/worker-management/hooks/useWorkerInfoForm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SelectField } from "@/shared/ui/select-field";

const GENDER_LABELS: Record<GenderValue, string> = {
  male: "남성",
  female: "여성",
};

const GENDER_OPTIONS = GENDER_VALUES.map((value) => ({ value, label: GENDER_LABELS[value] }));

type WorkerInfoFormProps = {
  action: (input: WorkerInfoActionInput) => Promise<WorkerInfoOutcome>;
  initialValues: {
    name: string;
    phone: string;
    gender: GenderValue;
    birthDate: string;
  };
};

export function WorkerInfoForm({ action, initialValues }: WorkerInfoFormProps) {
  const { state, formAction, pending } = useWorkerInfoForm(action);
  const [name, setName] = useState(initialValues.name);
  const [phone, setPhone] = useState(initialValues.phone);
  const [gender, setGender] = useState<string | null>(initialValues.gender);
  const [birthDate, setBirthDate] = useState(initialValues.birthDate);
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="이름"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors?.name}
      />
      <Input
        label="휴대폰 번호"
        name="phone"
        type="tel"
        inputMode="numeric"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={fieldErrors?.phone}
      />
      <div className="flex flex-col gap-1.5">
        <SelectField
          label="성별"
          value={gender}
          onChange={setGender}
          options={GENDER_OPTIONS}
          error={fieldErrors?.gender}
        />
        <input type="hidden" name="gender" value={gender ?? ""} />
      </div>
      <Input
        label="생년월일"
        name="birthDate"
        type="date"
        value={birthDate}
        onChange={(event) => setBirthDate(event.target.value)}
        error={fieldErrors?.birthDate}
      />
      <Button type="submit" variant="primary" loading={pending} disabled={pending}>
        저장
      </Button>
    </form>
  );
}
