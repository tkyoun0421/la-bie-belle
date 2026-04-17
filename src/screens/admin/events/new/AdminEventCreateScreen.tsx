import { AdminEventCreateForm } from "#/screens/admin/events/new/_components/AdminEventCreateForm";

export function AdminEventCreateScreen() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#fff7ed_0%,#fff1d6_54%,#fffaf1_100%)] px-6 py-7 shadow-[0_24px_72px_rgba(15,23,42,0.08)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
          Phase 0.5 / Slice 2
        </p>
        <div className="mt-3 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
            행사 스케줄을 한 번에 생성합니다.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] md:text-base">
            템플릿을 골라 기본 설정을 불러오고, 달력에서 여러 날짜를 선택해
            대량으로 행사를 생성할 수 있습니다. 이미 행사가 있는 날짜는 제외됩니다.
          </p>
        </div>
      </section>

      <AdminEventCreateForm />
    </main>
  );
}
