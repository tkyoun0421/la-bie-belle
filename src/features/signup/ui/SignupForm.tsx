"use client";

import { useState } from "react";

import { GENDER_VALUES, type GenderValue } from "@/entities/identity/model/signup";
import {
  useSignupForm,
  type SignupActionInput,
  type SignupOutcome,
} from "@/features/signup/hooks/useSignupForm";
import { PRIVACY_PATH } from "@/shared/config/auth-routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SelectField } from "@/shared/ui/select-field";

const GENDER_LABELS: Record<GenderValue, string> = {
  male: "남성",
  female: "여성",
};

const GENDER_OPTIONS = GENDER_VALUES.map((value) => ({ value, label: GENDER_LABELS[value] }));

type SignupFormProps = {
  action: (input: SignupActionInput) => Promise<SignupOutcome>;
};

export function SignupForm({ action }: SignupFormProps) {
  const { state, formAction, pending } = useSignupForm(action);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Input
          label="이름"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors?.name}
        />
        <Input
          label="휴대폰 번호"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-1234-5678"
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
            placeholder="선택해 주세요"
            error={fieldErrors?.gender}
          />
          <p className="typo-caption text-text-muted">성별은 포지션 배정 조건 확인에 사용돼요</p>
          <input type="hidden" name="gender" value={gender ?? ""} />
        </div>
        <Input
          label="생년월일"
          name="birthDate"
          type="date"
          autoComplete="bday"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          error={fieldErrors?.birthDate}
        />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-3 border-t border-border bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <p className="typo-caption text-text-muted">
          제출하면{" "}
          <a href={PRIVACY_PATH} className="underline">
            개인정보 처리방침
          </a>
          에 동의한 것으로 보아요
        </p>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={pending}
          disabled={pending}
        >
          가입 신청하기
        </Button>
      </div>
    </form>
  );
}
