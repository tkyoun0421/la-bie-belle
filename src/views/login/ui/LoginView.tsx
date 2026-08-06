import { PRIVACY_PATH } from "@/shared/config/auth-routes.config";
import { Button } from "@/shared/ui/button";

type LoginViewProps = {
  hasAuthError: boolean;
  onSignIn: () => void | Promise<void>;
};

export function LoginView({ hasAuthError, onSignIn }: LoginViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-10 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="typo-display text-text-strong">라비에벨</h1>
        <p className="typo-body text-text">근무 신청부터 출퇴근, 예상 급여까지 한곳에서 관리해요</p>
      </div>
      <form action={onSignIn} className="flex w-full flex-col items-center gap-3">
        <Button type="submit" variant="primary" className="w-full">
          Google로 계속하기
        </Button>
        {hasAuthError ? (
          <p role="alert" className="typo-caption text-danger">
            로그인에 실패했어요. 다시 시도해 주세요
          </p>
        ) : null}
      </form>
      <a href={PRIVACY_PATH} className="typo-caption text-text-muted underline">
        개인정보 처리방침
      </a>
    </main>
  );
}
