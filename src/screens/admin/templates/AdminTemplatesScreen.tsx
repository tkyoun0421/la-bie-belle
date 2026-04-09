import { AdminTemplatesClient } from "#/screens/admin/templates/_components/AdminTemplatesClient";

type AdminTemplatesScreenProps = {
  initialTemplateCount: number;
};

export function AdminTemplatesScreen({
  initialTemplateCount,
}: AdminTemplatesScreenProps) {
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#f6fbff_0%,#eef5ff_55%,#f8fbff_100%)] px-6 py-7 shadow-[0_24px_72px_rgba(15,23,42,0.08)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
          Phase 1 / Slice 1
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              행사 템플릿을 실제 데이터로 만들고 관리합니다.
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] md:text-base">
              템플릿 CRUD와 슬롯 기본값이 Supabase에 바로 반영되고, 화면은
              hydration과 query cache를 기준으로 갱신됩니다.
            </p>
          </div>
          <div className="grid gap-3 rounded-[24px] border border-[var(--border-soft)] bg-white/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              현재 템플릿
            </span>
            <strong className="text-3xl font-extrabold text-[var(--foreground)]">
              {initialTemplateCount}
            </strong>
          </div>
        </div>
      </section>

      <AdminTemplatesClient />
    </main>
  );
}
