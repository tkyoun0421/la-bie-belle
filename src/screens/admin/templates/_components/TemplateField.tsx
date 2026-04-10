import type { ReactNode } from "react";
import { FormFieldError } from "#/shared/components/common/FormFieldError";
import { Label } from "#/shared/components/ui/label";

type TemplateFieldProps = {
  children: ReactNode;
  error?: string | null;
  errorClassName?: string;
  label: string;
};

export function TemplateField({
  children,
  error,
  errorClassName,
  label,
}: Readonly<TemplateFieldProps>) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      {children}
      <FormFieldError className={errorClassName} message={error} />
    </label>
  );
}
