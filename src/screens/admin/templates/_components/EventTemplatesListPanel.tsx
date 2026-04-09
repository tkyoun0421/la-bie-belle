import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";

type EventTemplatesListPanelProps = {
  deletePending: boolean;
  editingTemplateId: string | null;
  highlightedTemplateId: string | null;
  searchTerm: string;
  templates: EventTemplate[];
  onDelete: (template: EventTemplate) => void;
  onEdit: (template: EventTemplate) => void;
  onSearchTermChange: (value: string) => void;
};

export function EventTemplatesListPanel({
  deletePending,
  editingTemplateId,
  highlightedTemplateId,
  searchTerm,
  templates,
  onDelete,
  onEdit,
  onSearchTermChange,
}: EventTemplatesListPanelProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            템플릿 목록
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
            Supabase에서 읽어 온 템플릿과 슬롯 기본값입니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <label
          className="text-sm font-semibold text-[var(--foreground)]"
          htmlFor="template-search"
        >
          목록 검색
        </label>
        <input
          className={inputClassName}
          id="template-search"
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="템플릿 이름 또는 포지션 이름"
          value={searchTerm}
        />
      </div>

      <div className="mt-4 grid gap-3">
        {templates.map((template) => {
          const isEditing = template.id === editingTemplateId;
          const isHighlighted = template.id === highlightedTemplateId;

          return (
            <article
              className={[
                "rounded-[24px] border p-5 transition-colors",
                isHighlighted
                  ? "border-[#9ac2ff] bg-[#f5faff] shadow-[0_16px_38px_rgba(43,127,255,0.12)]"
                  : "border-[var(--border-soft)] bg-white",
              ].join(" ")}
              key={template.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-subtle)]">
                    {template.timeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--surface-tint)] px-3 py-1 text-xs font-semibold text-[var(--text-subtle)]">
                    {isEditing
                      ? "수정 중"
                      : isHighlighted
                        ? "방금 저장됨"
                        : "저장됨"}
                  </span>
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => onEdit(template)}
                    type="button"
                  >
                    수정
                  </button>
                  <button
                    className={dangerButtonClassName}
                    disabled={deletePending}
                    onClick={() => onDelete(template)}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {template.slotDefaults.map((slot) => (
                  <span
                    className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-subtle)]"
                    key={`${template.id}-${slot.positionId}`}
                  >
                    {slot.positionName} - 필수 {slot.requiredCount} / 교육{" "}
                    {slot.trainingCount}
                  </span>
                ))}
              </div>
            </article>
          );
        })}

        {templates.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-8 text-center text-sm text-[var(--text-subtle)]">
            아직 템플릿이 없거나 검색 결과가 없습니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}

const inputClassName =
  "h-11 rounded-2xl border border-[var(--border-strong)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(43,127,255,0.16)]";

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50";

const dangerButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#e7b6b2] bg-[#fff5f3] px-4 py-2 text-sm font-semibold text-[#b64135] transition-colors hover:bg-[#ffe9e4] disabled:cursor-not-allowed disabled:opacity-50";
