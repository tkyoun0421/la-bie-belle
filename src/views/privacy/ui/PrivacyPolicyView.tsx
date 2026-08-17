export function PrivacyPolicyView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6">
      <h1 className="typo-headline-md text-text-strong">개인정보 처리방침</h1>

      <section className="flex flex-col gap-2">
        <h2 className="typo-title text-text-strong">수집하는 개인정보</h2>
        <p className="typo-body text-text">
          Google 계정 이메일(로그인용), 이름, 휴대폰 번호, 성별, 생년월일을 수집해요
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="typo-title text-text-strong">이용 목적</h2>
        <p className="typo-body text-text">
          이메일은 로그인 확인에, 이름과 휴대폰 번호는 근무 배정과 연락에 사용해요. 성별은 포지션
          배정 조건 확인에, 생년월일은 근무 자격 확인에 쓰여요
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="typo-title text-text-strong">보관 기간</h2>
        <p className="typo-body text-text">
          한 번도 승인되지 않았거나 승인이 거절된 계정은 가입 또는 거절 시점부터 3개월 후 개인정보를
          완전히 삭제해요. 활성·휴면 계정은 마지막 활동일로부터 1년이 지나면 자동으로 탈퇴 처리돼요.
          탈퇴 시 이름·생년월일·성별 등 일부 정보는 3년간 분리 보관한 뒤 완전히 삭제해요
        </p>
      </section>
    </main>
  );
}
