/**
 * Violation record shared by every gate.
 *
 * Gates never throw for contract breaches: they collect violations and let the
 * entry point decide how to report and which exit code to use.
 */
export type Violation = {
  /** Gate name as used in package.json scripts, e.g. "gate:index". */
  readonly gate: string;
  /** Korean description of what is wrong. */
  readonly message: string;
  /** Repository relative path of the offending file, when there is one. */
  readonly file?: string;
  /** 1-based line number inside `file`, when the violation is line scoped. */
  readonly line?: number;
  /** Korean hint describing how to fix the violation. */
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

/**
 * Writes violations to stderr and returns the process exit code.
 * Returns 0 without writing anything when there is no violation.
 */
export function reportViolations(violations: readonly Violation[]): number {
  if (violations.length === 0) {
    return 0;
  }
  process.stderr.write(`${formatViolations(violations)}\n`);
  return 1;
}
