import Link from "next/link";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import type { Position } from "#/entities/positions/models/schemas/position";
import { TemplateEditorPageClient } from "#/screens/admin/templates/_components/TemplateEditorPageClient";

type TemplateEditorPageSectionProps = {
  description: string;
  eyebrow: string;
  initialTemplate: EventTemplate | null;
  positions: Position[];
  templatesCount: number;
  title: string;
};

export function TemplateEditorPageSection({
  description,
  eyebrow,
  initialTemplate,
  positions,
  templatesCount,
  title,
}: Readonly<TemplateEditorPageSectionProps>) {
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#f6fbff_0%,#eef5ff_55%,#f8fbff_100%)] px-6 py-7 shadow-[0_24px_72px_rgba(15,23,42,0.08)] md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] md:text-base">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-end">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-soft)]"
              href="/admin/templates"
            >
              목록으로 돌아가기
            </Link>
            <div className="grid gap-3 rounded-[24px] border border-[var(--border-soft)] bg-white/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                현재 템플릿
              </span>
              <strong className="text-3xl font-extrabold text-[var(--foreground)]">
                {templatesCount}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section>
        <TemplateEditorPageClient
          initialTemplate={initialTemplate}
          positions={positions}
          templatesCount={templatesCount}
        />
      </section>
    </main>
  );
}
