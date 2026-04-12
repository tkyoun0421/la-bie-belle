import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { TemplateEventCreatePageClient } from "#/screens/admin/templates/[templateId]/create-event/_components/TemplateEventCreatePageClient";

type AdminTemplateEventCreateScreenProps = {
  template: EventTemplate;
};

export function AdminTemplateEventCreateScreen({
  template,
}: Readonly<AdminTemplateEventCreateScreenProps>) {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#fff7ed_0%,#fff1d6_54%,#fffaf1_100%)] px-6 py-7 shadow-[0_24px_72px_rgba(15,23,42,0.08)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
          Phase 1 / Slice 2
        </p>
        <div className="mt-3 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-4xl">
            템플릿에서 실제 행사를 생성합니다.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] md:text-base">
            선택한 템플릿은 <strong>{template.name}</strong> 입니다. 저장하면
            event 레코드와 기본 포지션 슬롯이 생성되고, 바로 행사 상세 화면으로
            이동합니다.
          </p>
        </div>
      </section>

      <TemplateEventCreatePageClient template={template} />
    </main>
  );
}
