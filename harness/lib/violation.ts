export type Violation = {
  readonly gate: string;
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly hint?: string;
};

function formatLocation(violation: Violation): string {
  if (violation.file === undefined) {
    return "";
  }
  if (violation.line === undefined) {
    return ` ${violation.file}`;
  }
  return ` ${violation.file}:${violation.line}`;
}

export function formatViolation(violation: Violation): string {
  const head = `[${violation.gate}]${formatLocation(violation)} ${violation.message}`;
  return violation.hint === undefined ? head : `${head}\n  힌트: ${violation.hint}`;
}

export function formatViolations(violations: readonly Violation[]): string {
  const body = violations.map(formatViolation).join("\n");
  return `${body}\n게이트 위반 ${violations.length}건이 발견되어 중단합니다.`;
}

export function reportViolations(violations: readonly Violation[]): number {
  if (violations.length === 0) {
    return 0;
  }
  process.stderr.write(`${formatViolations(violations)}\n`);
  return 1;
}
