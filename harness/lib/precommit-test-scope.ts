import { matchesAnyGlob } from "./glob.ts";

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

function isUnclassifiable(path: string): boolean {
  return path.trim().length === 0 || path.startsWith("/");
}

export function classifyStagedFiles(paths: readonly string[]): TestScopeJudgment {
  if (paths.some(isUnclassifiable)) {
    return { mode: "full" };
  }
  if (paths.length === 0) {
    return { mode: "skip" };
  }
  if (paths.some((path) => matchesAnyGlob(path, BROAD_IMPACT_GLOBS))) {
    return { mode: "full" };
  }
  const codeFiles = paths.filter((path) => matchesAnyGlob(path, CODE_PATH_GLOBS));
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
  return { args: ["related", ...(judgment.files ?? []), "--run"] };
}

export function runPrecommitTestScope(
  stagedFiles: readonly string[],
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
