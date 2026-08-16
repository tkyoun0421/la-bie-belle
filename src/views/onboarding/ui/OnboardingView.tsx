import { SignupForm } from "@/features/signup/ui/SignupForm";
import type { SignupActionInput, SignupOutcome } from "@/features/signup/hooks/useSignupForm";

type OnboardingViewProps = {
  action: (input: SignupActionInput) => Promise<SignupOutcome>;
};

export function OnboardingView({ action }: OnboardingViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="typo-display text-text-strong">가입 정보를 입력해 주세요</h1>
        <p className="typo-body text-text">입력한 정보는 근무 배정과 연락에 사용돼요</p>
      </div>
      <SignupForm action={action} />
    </main>
  );
}
