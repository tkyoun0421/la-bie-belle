import { cn } from "@/shared/lib/utils";

const SIGN_IN_NOTICE = "가입하면 관리자가 확인한 뒤에\n근무표가 보여요";

const APPEAR =
  "animate-in fade-in fill-mode-backwards ease-out animation-duration-[var(--duration-slower)] motion-safe:slide-in-from-bottom-4";

export function LoginScreen({ onSignIn }: { onSignIn: () => Promise<void> }) {
  return (
    <main className="flex flex-1 flex-col items-center bg-bg-neutral px-6 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className={cn(
            APPEAR,
            "mb-5 flex size-12 items-center justify-center rounded-lg bg-bg-brand-solid text-lg font-bold text-fg-brand-contrast",
          )}
        >
          라
        </div>
        <h1
          className={cn(
            APPEAR,
            "text-2xl font-bold text-fg-neutral [--tw-animation-delay:calc(var(--stagger-step)*1)]",
          )}
        >
          라비에벨
        </h1>
        <p
          className={cn(
            APPEAR,
            "mt-2 text-sm text-fg-neutral-subtle [--tw-animation-delay:calc(var(--stagger-step)*2)]",
          )}
        >
          근무표와 급여를 한곳에서 봐요
        </p>
      </div>

      <form action={onSignIn} className="w-full">
        <button
          type="submit"
          className={cn(
            APPEAR,
            "flex h-12 w-full items-center justify-center gap-3 rounded-full border border-google-stroke bg-google-bg text-sm font-medium text-google-fg transition-transform duration-[var(--duration-fast)] [--tw-animation-delay:calc(var(--stagger-step)*3)] motion-safe:active:scale-[0.97]",
          )}
        >
          <span className="size-6 shrink-0 bg-[url(/google-g.svg)] bg-contain bg-center bg-no-repeat" />
          Google 계정으로 로그인
        </button>
        <p
          className={cn(
            APPEAR,
            "mt-4 text-center text-xs whitespace-pre-line text-fg-neutral-subtle [--tw-animation-delay:calc(var(--stagger-step)*4)]",
          )}
        >
          {SIGN_IN_NOTICE}
        </p>
      </form>
    </main>
  );
}
