export function PendingView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="typo-display text-text-strong">승인을 기다리고 있어요</h1>
      <p className="typo-body text-text">관리자가 가입 내용을 확인하는 대로 이용할 수 있어요</p>
      <p className="typo-caption text-text-muted">급한 문의는 운영 담당자에게 직접 연락해 주세요</p>
    </main>
  );
}
