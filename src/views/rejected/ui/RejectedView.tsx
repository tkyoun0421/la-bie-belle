export function RejectedView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="typo-display text-text-strong">가입이 승인되지 않았어요</h1>
      <p className="typo-body text-text">관리자가 가입 신청을 확인한 결과 이용이 제한됐어요</p>
      <p className="typo-caption text-text-muted">급한 문의는 운영 담당자에게 직접 연락해 주세요</p>
    </main>
  );
}
