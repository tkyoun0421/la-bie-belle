import Link from "next/link";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";

type TemplateFormSlot = CreateEventTemplateInput["slotDefaults"][number];
type TemplateSlotRow = TemplateFormSlot & {
  _key: string;
};

type EventTemplateEditorCardProps = {
  canManageSlots: boolean;
  editingTemplateId: string | null;
  error: string | null;
  formState: {
    firstServiceAt: string;
    lastServiceEndAt: string;
    name: string;
  };
  isSaving: boolean;
  positionOptions: Array<{
    label: string;
    value: string;
  }>;
  onAddSlotRow: () => void;
  onCancel: () => void;
  onFieldChange: (
    field: "firstServiceAt" | "lastServiceEndAt" | "name",
    value: string
  ) => void;
  onRemoveSlotRow: (slotIndex: number) => void;
  onSubmit: () => void;
  onUpdateSlot: (
    slotIndex: number,
    field: keyof TemplateFormSlot,
    nextValue: string
  ) => void;
  slotRows: TemplateSlotRow[];
};

export function EventTemplateEditorCard({
  canManageSlots,
  editingTemplateId,
  error,
  formState,
  isSaving,
  positionOptions,
  onAddSlotRow,
  onCancel,
  onFieldChange,
  onRemoveSlotRow,
  onSubmit,
  onUpdateSlot,
  slotRows,
}: EventTemplateEditorCardProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          {editingTemplateId ? "템플릿 수정" : "새 템플릿 만들기"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
          저장은 server action으로 처리하고, 목록은 TanStack Query cache에 바로
          반영합니다.
        </p>
      </div>

      <form
        className="mt-6 grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="템플릿 이름">
            <input
              className={inputClassName}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="예: 토요일 프리미엄 웨딩"
              value={formState.name}
            />
          </Field>
          <Field label="첫 서비스 시작">
            <input
              className={inputClassName}
              onChange={(event) =>
                onFieldChange("firstServiceAt", event.target.value)
              }
              type="time"
              value={formState.firstServiceAt}
            />
          </Field>
          <Field label="마지막 서비스 종료">
            <input
              className={inputClassName}
              onChange={(event) =>
                onFieldChange("lastServiceEndAt", event.target.value)
              }
              type="time"
              value={formState.lastServiceEndAt}
            />
          </Field>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                슬롯 기본값
              </h3>
              <p className="text-sm text-[var(--text-subtle)]">
                행사 생성 시 그대로 복사될 포지션별 필요 인원입니다.
              </p>
            </div>
            <button
              className={secondaryButtonClassName}
              disabled={!canManageSlots}
              onClick={onAddSlotRow}
              type="button"
            >
              슬롯 추가
            </button>
          </div>
          <div className="flex justify-end">
            <Link
              className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
              href="/admin/positions"
            >
              포지션 관리 화면으로 가기
            </Link>
          </div>

          <div className="grid gap-3">
            {slotRows.map((slot, index) => (
              <div
                className="grid gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4 md:grid-cols-[minmax(0,1.2fr)_140px_140px_auto]"
                key={slot._key}
              >
                <Field label="포지션">
                  <select
                    className={inputClassName}
                    onChange={(event) =>
                      onUpdateSlot(index, "positionId", event.target.value)
                    }
                    value={slot.positionId}
                  >
                    {positionOptions.map((position) => (
                      <option key={position.value} value={position.value}>
                        {position.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="필수 인원">
                  <input
                    className={inputClassName}
                    min="1"
                    onChange={(event) =>
                      onUpdateSlot(index, "requiredCount", event.target.value)
                    }
                    type="number"
                    value={slot.requiredCount}
                  />
                </Field>
                <Field label="교육 인원">
                  <input
                    className={inputClassName}
                    min="0"
                    onChange={(event) =>
                      onUpdateSlot(index, "trainingCount", event.target.value)
                    }
                    type="number"
                    value={slot.trainingCount}
                  />
                </Field>
                <div className="flex items-end">
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => onRemoveSlotRow(index)}
                    type="button"
                  >
                    제거
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl border border-[#f7d4d1] bg-[#fff4f3] px-4 py-3 text-sm text-[#a5352c]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className={primaryButtonClassName}
            disabled={isSaving || !canManageSlots}
            type="submit"
          >
            {isSaving
              ? "저장 중..."
              : editingTemplateId
                ? "템플릿 수정"
                : "템플릿 저장"}
          </button>
          {editingTemplateId ? (
            <button
              className={secondaryButtonClassName}
              onClick={onCancel}
              type="button"
            >
              수정 취소
            </button>
          ) : null}
          <span className="text-sm text-[var(--text-subtle)]">
            {canManageSlots
              ? "저장 결과는 오른쪽 목록에 바로 반영됩니다."
              : "먼저 포지션 관리 화면에서 포지션을 추가해 주세요."}
          </span>
        </div>
      </form>
    </section>
  );
}

function Field({
  children,
  label,
}: Readonly<{
  children: React.ReactNode;
  label: string;
}>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-11 rounded-2xl border border-[var(--border-strong)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(43,127,255,0.16)]";

const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50";
