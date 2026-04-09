import { formatPositionAllowedGenderLabel } from "#/entities/positions/models/constants/allowedGender";
import type { Position } from "#/entities/positions/models/schemas/position";

type PositionsListPanelProps = {
  isDeleting: boolean;
  positions: Position[];
  searchTerm: string;
  totalCount: number;
  onDelete: (position: Position) => void;
  onEdit: (position: Position) => void;
  onSearchTermChange: (value: string) => void;
};

export function PositionsListPanel({
  isDeleting,
  positions,
  searchTerm,
  totalCount,
  onDelete,
  onEdit,
  onSearchTermChange,
}: PositionsListPanelProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            포지션 목록
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
            현재 저장된 포지션 마스터 데이터입니다.
          </p>
        </div>
        <strong className="text-sm font-semibold text-[var(--text-subtle)]">
          총 {totalCount}개
        </strong>
      </div>

      <div className="mt-4 grid gap-2">
        <label
          className="text-sm font-semibold text-[var(--foreground)]"
          htmlFor="position-search"
        >
          목록 검색
        </label>
        <input
          className={inputClassName}
          id="position-search"
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="포지션 이름 또는 성별"
          value={searchTerm}
        />
      </div>

      <div className="mt-4 grid gap-3">
        {positions.map((position) => (
          <article
            className="rounded-[24px] border border-[var(--border-soft)] bg-white px-5 py-4"
            key={position.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  {position.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-subtle)]">
                  가능 성별:{" "}
                  {formatPositionAllowedGenderLabel(position.allowedGender)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className={secondaryButtonClassName}
                  onClick={() => onEdit(position)}
                  type="button"
                >
                  수정
                </button>
                <button
                  className={dangerButtonClassName}
                  disabled={isDeleting}
                  onClick={() => onDelete(position)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {position.id}
            </p>
          </article>
        ))}

        {positions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-8 text-center text-sm text-[var(--text-subtle)]">
            아직 포지션이 없거나 검색 결과가 없습니다.
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
