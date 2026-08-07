import { matchesAnyGlob } from "./glob.ts";
import type { StagedFileChange } from "./repo.ts";

export type TestScopeMode = "skip" | "related" | "full";

export type TestScopeJudgment = {
  readonly mode: TestScopeMode;
  readonly files?: readonly string[];
};

export type VitestCommand = {
  readonly args: readonly string[];
};

export type RunResult = {
  readonly exitCode: number;
};

export type VitestRunner = (args: readonly string[]) => RunResult;

export const CODE_PATH_GLOBS: readonly string[] = [
  "src/**",
  "tests/**",
  "harness/**",
  "tools/**",
  "supabase/**",
  "config/**",
  "scripts/**",
  ".githooks/**",
  "next.config.ts",
  "eslint.config.mjs",
  "eslint.config.ci.mjs",
  "postcss.config.mjs",
  "playwright.config.ts",
  "components.json",
  ".prettierrc",
];

export const BROAD_IMPACT_GLOBS: readonly string[] = [
  "package.json",
  "pnpm-lock.yaml",
  "vitest.config.*",
  "tsconfig*",
  "config/fsd.json",
  "tests/setup-*.ts",
];

function isUnclassifiablePath(path: string): boolean {
  return path.trim().length === 0 || path.startsWith("/");
}

function isUnclassifiable(change: StagedFileChange): boolean {
  if (change.status.trim().length === 0) {
    return true;
  }
  if (isUnclassifiablePath(change.path)) {
    return true;
  }
  return change.previousPath !== undefined && isUnclassifiablePath(change.previousPath);
}

function isDeletionOrRename(change: StagedFileChange): boolean {
  return change.status.startsWith("D") || change.status.startsWith("R");
}

export function classifyStagedFiles(changes: readonly StagedFileChange[]): TestScopeJudgment {
  if (changes.some(isUnclassifiable)) {
    return { mode: "full" };
  }
  if (changes.length === 0) {
    return { mode: "skip" };
  }
  if (changes.some(isDeletionOrRename)) {
    return { mode: "full" };
  }
  if (changes.some((change) => matchesAnyGlob(change.path, BROAD_IMPACT_GLOBS))) {
    return { mode: "full" };
  }
  const codeFiles = changes
    .filter((change) => matchesAnyGlob(change.path, CODE_PATH_GLOBS))
    .map((change) => change.path);
  if (codeFiles.length === 0) {
    return { mode: "skip" };
  }
  return { mode: "related", files: codeFiles };
}

export function buildVitestCommand(judgment: TestScopeJudgment): VitestCommand | null {
  if (judgment.mode === "skip") {
    return null;
  }
  if (judgment.mode === "full") {
    return { args: ["run"] };
  }
  return {
    args: ["related", ...(judgment.files ?? []), "--run", "--passWithNoTests=false"],
  };
}

export function runPrecommitTestScope(
  stagedFiles: readonly StagedFileChange[],
  runVitest: VitestRunner,
): RunResult {
  const judgment = classifyStagedFiles(stagedFiles);
  const command = buildVitestCommand(judgment);
  if (command === null) {
    return { exitCode: 0 };
  }

  const result = runVitest(command.args);
  if (judgment.mode !== "related" || result.exitCode === 0) {
    return result;
  }

  const fullCommand = buildVitestCommand({ mode: "full" });
  if (fullCommand === null) {
    return result;
  }
  return runVitest(fullCommand.args);
}
