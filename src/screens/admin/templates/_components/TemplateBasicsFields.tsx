import { cn } from "#/shared/lib/utils";
import { Input } from "#/shared/components/ui/input";
import type {
  TemplateFieldErrors,
  TemplateFieldName,
  TemplateFormState,
} from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateField } from "#/screens/admin/templates/_components/TemplateField";

type TemplateBasicsFieldsProps = {
  fieldErrors: Pick<
    TemplateFieldErrors,
    "firstServiceAt" | "lastServiceEndAt" | "name"
  >;
  formState: TemplateFormState;
  isPrimaryLocked: boolean;
  onFieldChange: (field: TemplateFieldName, value: string) => void;
  onPrimaryChange: (nextValue: boolean) => void;
};

export function TemplateBasicsFields({
  fieldErrors,
  formState,
  isPrimaryLocked,
  onFieldChange,
  onPrimaryChange,
}: Readonly<TemplateBasicsFieldsProps>) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <TemplateField error={fieldErrors.name} label="템플릿 이름">
        <Input
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="예: 주말 프리미엄 웨딩"
          value={formState.name}
        />
      </TemplateField>

      <TemplateField error={fieldErrors.firstServiceAt} label="첫 서비스 시작">
        <Input
          onChange={(event) =>
            onFieldChange("firstServiceAt", event.target.value)
          }
          type="time"
          value={formState.firstServiceAt}
        />
      </TemplateField>

      <TemplateField
        error={fieldErrors.lastServiceEndAt}
        label="마지막 서비스 종료"
      >
        <Input
          onChange={(event) =>
            onFieldChange("lastServiceEndAt", event.target.value)
          }
          type="time"
          value={formState.lastServiceEndAt}
        />
      </TemplateField>

      <label
        className={cn(
          "md:col-span-3 flex items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3",
          isPrimaryLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"
        )}
      >
        <input
          checked={formState.isPrimary}
          className="mt-0.5 size-4 rounded border border-[var(--border-strong)]"
          disabled={isPrimaryLocked}
          onChange={(event) => onPrimaryChange(event.target.checked)}
          type="checkbox"
        />
        <div className="grid gap-1">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            대표 템플릿으로 설정
          </span>
          <span className="text-sm text-[var(--text-subtle)]">
            대표 템플릿은 항상 하나만 유지됩니다. 다른 템플릿을 대표로
            지정하면 기존 대표는 자동으로 해제됩니다.
          </span>
          {isPrimaryLocked ? (
            <span className="text-xs font-medium text-[var(--text-muted)]">
              현재 대표 템플릿은 직접 해제할 수 없습니다.
            </span>
          ) : null}
        </div>
      </label>
    </div>
  );
}
