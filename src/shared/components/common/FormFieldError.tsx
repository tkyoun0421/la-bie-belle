import { cn } from "#/shared/lib/utils";

type FormFieldErrorProps = {
  className?: string;
  message?: string | null;
};

export function FormFieldError({
  className,
  message,
}: Readonly<FormFieldErrorProps>) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        "text-xs font-medium leading-5 text-[var(--destructive)]",
        className
      )}
    >
      {message}
    </p>
  );
}
