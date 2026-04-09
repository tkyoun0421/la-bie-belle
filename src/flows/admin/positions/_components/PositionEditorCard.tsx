import { positionAllowedGenderOptions } from "#/queries/positions/models/constants/allowedGender";
import type { PositionAllowedGender } from "#/queries/positions/models/schemas/position";

type PositionEditorCardProps = {
  allowedGender: PositionAllowedGender;
  error: string | null;
  isEditing: boolean;
  isSaving: boolean;
  name: string;
  onAllowedGenderChange: (value: PositionAllowedGender) => void;
  onCancel: () => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
};

export function PositionEditorCard({
  allowedGender,
  error,
  isEditing,
  isSaving,
  name,
  onAllowedGenderChange,
  onCancel,
  onNameChange,
  onSubmit,
}: PositionEditorCardProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          {isEditing ? "포지션 수정" : "새 포지션 추가"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
          중복 이름은 막고, 저장 결과는 목록과 템플릿 선택지에 바로 반영됩니다.
        </p>
      </div>

      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            포지션 이름
          </span>
          <input
            className={inputClassName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="예: 안내 데스크"
            value={name}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            가능 성별
          </span>
          <select
            className={inputClassName}
            onChange={(event) =>
              onAllowedGenderChange(event.target.value as PositionAllowedGender)
            }
            value={allowedGender}
          >
            {positionAllowedGenderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="rounded-2xl border border-[#f7d4d1] bg-[#fff4f3] px-4 py-3 text-sm text-[#a5352c]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className={primaryButtonClassName}
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "저장 중..." : isEditing ? "포지션 수정" : "포지션 저장"}
          </button>
          {isEditing ? (
            <button
              className={secondaryButtonClassName}
              onClick={onCancel}
              type="button"
            >
              수정 취소
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

const inputClassName =
  "h-11 rounded-2xl border border-[var(--border-strong)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(43,127,255,0.16)]";

const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50";
