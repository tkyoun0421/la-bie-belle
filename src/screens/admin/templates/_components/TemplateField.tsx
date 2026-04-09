import type { ReactNode } from "react";
import { Label } from "#/shared/components/ui/label";

type TemplateFieldProps = {
  children: ReactNode;
  label: string;
};

export function TemplateField({
  children,
  label,
}: Readonly<TemplateFieldProps>) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
