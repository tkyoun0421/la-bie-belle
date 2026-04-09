import { useFormState, useWatch, type UseFormReturn } from "react-hook-form";
import { cn } from "#/shared/lib/utils";
import { FormFieldError } from "#/shared/components/common/FormFieldError";
import { Input } from "#/shared/components/ui/input";
import type { CreateEventTemplateInput } from "#/mutations/events/schemas/createEventTemplate";
import type { TemplateFieldName } from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateField } from "#/screens/admin/templates/_components/TemplateField";

type TemplateBasicsFieldsProps = {
  form: UseFormReturn<CreateEventTemplateInput>;
  isPrimaryLocked: boolean;
  onFieldChange: (field: TemplateFieldName, value: string) => void;
  onPrimaryChange: (nextValue: boolean) => void;
};

export function TemplateBasicsFields({
  form,
  isPrimaryLocked,
  onFieldChange,
  onPrimaryChange,
}: Readonly<TemplateBasicsFieldsProps>) {
  const [name, firstServiceAt, lastServiceEndAt, isPrimary] = useWatch({
    control: form.control,
    name: ["name", "firstServiceAt", "lastServiceEndAt", "isPrimary"],
  });
  const { errors } = useFormState({
    control: form.control,
    name: ["name", "firstServiceAt", "lastServiceEndAt"],
  });
  const nameError = readFieldErrorMessage(errors.name?.message);
  const firstServiceAtError = readFieldErrorMessage(
    errors.firstServiceAt?.message
  );
  const lastServiceEndAtError = readFieldErrorMessage(
    errors.lastServiceEndAt?.message
  );
  const hasDesktopFieldError = Boolean(
    nameError || firstServiceAtError || lastServiceEndAtError
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <TemplateField
          error={nameError}
          errorClassName="md:hidden"
          label="템플릿 이름"
        >
          <Input
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="예: 주말 프리미엄 웨딩"
            value={name}
          />
        </TemplateField>

        <TemplateField
          error={firstServiceAtError}
          errorClassName="md:hidden"
          label="첫 식 시작"
        >
          <Input
            onChange={(event) =>
              onFieldChange("firstServiceAt", event.target.value)
            }
            type="time"
            value={firstServiceAt}
          />
        </TemplateField>

        <TemplateField
          error={lastServiceEndAtError}
          errorClassName="md:hidden"
          label="마지막 식 시작"
        >
          <Input
            onChange={(event) =>
              onFieldChange("lastServiceEndAt", event.target.value)
            }
            type="time"
            value={lastServiceEndAt}
          />
        </TemplateField>
      </div>

      {hasDesktopFieldError ? (
        <div className="hidden md:grid md:grid-cols-3 md:gap-4">
          <FormFieldError message={nameError} />
          <FormFieldError message={firstServiceAtError} />
          <FormFieldError message={lastServiceEndAtError} />
        </div>
      ) : null}

      <label
        className={cn(
          "flex items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3",
          isPrimaryLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"
        )}
      >
        <input
          checked={Boolean(isPrimary)}
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

function readFieldErrorMessage(message: unknown) {
  return typeof message === "string" ? message : null;
}
