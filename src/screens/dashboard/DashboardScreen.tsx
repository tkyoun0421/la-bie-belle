import { DashboardClient } from "#/screens/dashboard/_components/DashboardClient";

export function DashboardScreen() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#f4f9ff_0%,#f8fbf7_52%,#fff3e8_100%)] px-6 py-8 shadow-[0_24px_72px_rgba(15,23,42,0.08)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
          Phase 1 / Slice 3
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              달력에서 열린 날짜를 여러 개 고르고 바로 행사 신청을 처리합니다.
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] md:text-base">
              리스트를 길게 훑는 대신 달력에서 열린 날짜를 먼저 고르고, 선택한
              날짜의 행사에 바로 신청하거나 취소합니다. 상세 화면은 같은 상태를
              확인하는 fallback으로 유지합니다.
            </p>
          </div>
        </div>
      </section>

      <DashboardClient />
    </main>
  );
}
