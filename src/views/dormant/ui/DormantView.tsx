import { resolveAutoDepartureDate } from "@/entities/identity/model/dormancy";
import type { ReactivateOutcome } from "@/features/reactivation/hooks/useReactivateOwn";
import { ReactivateButton } from "@/features/reactivation/ui/ReactivateButton";

type DormantViewProps = {
  inactivityAnchorAt: string;
  onReactivate: () => Promise<ReactivateOutcome>;
};

export function DormantView({ inactivityAnchorAt, onReactivate }: DormantViewProps) {
  const autoDepartureDate = resolveAutoDepartureDate(inactivityAnchorAt);

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="typo-headline-md text-text-strong">휴면 상태예요</h1>
      <p className="typo-body text-text">다시 활동하기를 누르면 곧바로 서비스를 이용할 수 있어요</p>
      <p className="typo-body text-text">자동 탈퇴 예정일: {autoDepartureDate}</p>
      <ReactivateButton onReactivate={onReactivate} />
      <p className="typo-caption text-text-muted">급한 문의는 운영 담당자에게 직접 연락해 주세요</p>
    </main>
  );
}
