"use client";

import { useState } from "react";

import {
  useSignupForm,
  type SignupActionInput,
  type SignupOutcome,
} from "@/features/signup/hooks/useSignupForm";
import { PRIVACY_PATH } from "@/shared/config/auth-routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SelectField } from "@/shared/ui/select-field";

const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

type SignupFormProps = {
  action: (input: SignupActionInput) => Promise<SignupOutcome>;
};

export function SignupForm({ action }: SignupFormProps) {
  const { state, formAction, pending } = useSignupForm(action);
  const [gender, setGender] = useState<string | null>(null);
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Input label="이름" name="name" autoComplete="name" error={fieldErrors?.name} />
        <Input
          label="휴대폰 번호"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-1234-5678"
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
          error={fieldErrors?.birthDate}
        />
      </div>
      <div className="flex flex-col gap-3">
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
