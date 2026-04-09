import Link from "next/link";
import { AdminPositionsClient } from "#/screens/admin/positions/_components/AdminPositionsClient";

type AdminPositionsScreenProps = {
  initialPositionCount: number;
};

export function AdminPositionsScreen({
  initialPositionCount,
}: AdminPositionsScreenProps) {
  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#fffaf2_0%,#fff5e9_45%,#fffdf8_100%)] px-6 py-7 shadow-[0_24px_72px_rgba(15,23,42,0.08)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
          Admin / Positions
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              포지션 이름과 가능 성별을 실제 데이터로 관리합니다.
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] md:text-base">
              여기서 정의한 포지션은 템플릿과 이후 행사 생성 화면에서 그대로
              재사용됩니다.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-soft)]"
              href="/admin/templates"
            >
              템플릿 화면으로 이동
            </Link>
            <div className="grid gap-3 rounded-[24px] border border-[var(--border-soft)] bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                현재 포지션
              </span>
              <strong className="text-3xl font-extrabold text-[var(--foreground)]">
                {initialPositionCount}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <AdminPositionsClient />
    </main>
  );
}
