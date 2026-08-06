export function PrivacyPolicyView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6">
      <h1 className="typo-display text-text-strong">개인정보 처리방침</h1>

      <section className="flex flex-col gap-2">
        <h2 className="typo-title text-text-strong">수집하는 개인정보</h2>
        <p className="typo-body text-text">이름, 휴대폰 번호, 성별, 생년월일을 수집해요</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="typo-title text-text-strong">이용 목적</h2>
        <p className="typo-body text-text">
          근무 배정과 연락을 위해 사용해요. 성별은 포지션 배정 조건 확인에, 생년월일은 근무 자격
          확인에 쓰여요
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="typo-title text-text-strong">보관 기간</h2>
        <p className="typo-body text-text">
          승인되지 못하거나 탈퇴한 계정의 개인정보는 정해진 기간이 지나면 삭제하거나 분리 보관해요.
          자세한 기간과 절차는 운영 담당자에게 문의해 주세요
        </p>
      </section>
    </main>
  );
}
