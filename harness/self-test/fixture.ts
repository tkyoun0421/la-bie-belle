import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { RISK_LENS_COLUMNS, RISK_LENS_HEADING } from "../lib/radio-doc.ts";
import {
  INDEX_PATH,
  INDEX_SCHEMA_PATH,
  RADIO_LENS_SNAPSHOT_PATH,
  repoPath,
  resolveRepoRoot,
} from "../lib/repo.ts";
import type { IndexEntry } from "../lib/task-index.ts";
import { parseIndexJsonl } from "../lib/task-index.ts";
import type { Violation } from "../lib/violation.ts";

const createdRoots: string[] = [];
let cleanupRegistered = false;

function registerCleanup(): void {
  if (cleanupRegistered) {
    return;
  }
  cleanupRegistered = true;
  process.on("exit", () => {
    for (const root of createdRoots) {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

const FIXTURE_EXEMPT_TASKS: readonly string[] = ["P0-T01"];

export function createFixtureRoot(): string {
  registerCleanup();
  const root = mkdtempSync(join(tmpdir(), "lbb-gate-"));
  createdRoots.push(root);
  mkdirSync(join(root, dirname(INDEX_SCHEMA_PATH)), { recursive: true });
  copyFileSync(repoPath(resolveRepoRoot(), INDEX_SCHEMA_PATH), join(root, INDEX_SCHEMA_PATH));
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: FIXTURE_EXEMPT_TASKS });
  return root;
}

export function writeFixtureFile(root: string, relativePath: string, content: string): void {
  const absolutePath = join(root, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content);
}

export function writeFixtureJson(root: string, relativePath: string, value: unknown): void {
  writeFixtureFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function toJsonLines(records: readonly unknown[]): string {
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
}

export function writeIndexRecords(root: string, records: readonly unknown[]): void {
  writeFixtureFile(root, INDEX_PATH, toJsonLines(records));
}

export function indexEntriesOf(records: readonly unknown[]): readonly IndexEntry[] {
  return parseIndexJsonl(toJsonLines(records)).entries;
}

export function joinMessages(violations: readonly Violation[]): string {
  return violations.map((violation) => violation.message).join("\n");
}

export function writeIndexText(root: string, text: string): void {
  writeFixtureFile(root, INDEX_PATH, text);
}

const PLACEHOLDER_SHA256 = "0".repeat(64);

export function makePhase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: 3,
    kind: "phase",
    id: "P0",
    phase: "P0",
    title: "테스트 phase",
    summary: "테스트용 phase 레코드",
    status: "planned",
    priority: "must",
    depends_on: [],
    doc: "docs/execution/phases/00-foundation.md",
    spec_refs: ["DOCS:SDD"],
    verification: ["phase 종료 조건"],
    tags: ["fixture"],
    updated_at: "2026-08-03",
    ...overrides,
  };
}

export function makeTask(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: 3,
    kind: "task",
    id: "P0-T01",
    phase: "P0",
    title: "테스트 task",
    summary: "테스트용 task 레코드",
    status: "planned",
    priority: "must",
    depends_on: [],
    doc: "docs/execution/phases/00-foundation.md",
    spec_refs: ["DOCS:SDD"],
    verification: ["게이트 통과"],
    tags: ["fixture"],
    updated_at: "2026-08-03",
    approval_contract: "dual-approval-v3",
    product_approval: { by: "user", at: "2026-08-03" },
    development_approval: {
      by: "user",
      at: "2026-08-03",
      radio_revision: 1,
      radio_sha256: PLACEHOLDER_SHA256,
    },
    radio_ref: "docs/execution/radio/P0-T01-radio.md",
    test_mode: "tdd",
    check_ids: ["gate-self-test"],
    ...overrides,
  };
}

export function radioPathOf(taskId: string): string {
  return `docs/execution/radio/${taskId}-radio.md`;
}

export function makeRadioMarkdown(allowedPaths: readonly string[]): string {
  return [
    "# 테스트 RADIO",
    "",
    "## Requirements",
    "",
    "- 테스트용 문서다.",
    "",
    "## 변경 허용 경로",
    "",
    "```",
    ...allowedPaths,
    "```",
    "",
  ].join("\n");
}

export function writeRadio(root: string, taskId: string, allowedPaths: readonly string[]): string {
  const markdown = makeRadioMarkdown(allowedPaths);
  writeFixtureFile(root, radioPathOf(taskId), markdown);
  return createHash("sha256").update(Buffer.from(markdown)).digest("hex");
}

export function makeRiskLensRow(overrides: Readonly<Record<string, string>> = {}): Record<string, string> {
  const row: Record<string, string> = { "인수 조건": "정상 로그인" };
  for (const lens of RISK_LENS_COLUMNS.slice(1)) {
    row[lens] = "테스트함";
  }
  return { ...row, ...overrides };
}

export function makeRiskLensSection(rows: readonly Readonly<Record<string, string>>[]): string {
  const header = `| ${RISK_LENS_COLUMNS.join(" | ")} |`;
  const separator = `| ${RISK_LENS_COLUMNS.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) => `| ${RISK_LENS_COLUMNS.map((column) => row[column] ?? "").join(" | ")} |`,
  );
  return [RISK_LENS_HEADING, "", header, separator, ...body].join("\n");
}

export function writeRadioWithRiskLens(
  root: string,
  taskId: string,
  allowedPaths: readonly string[],
  lensSection: string | null,
): string {
  const markdown = [
    "# 테스트 RADIO",
    "",
    "## Requirements",
    "",
    "- 테스트용 문서다.",
    "",
    ...(lensSection === null ? [] : [lensSection, ""]),
    "### DEV-* 적용 상태",
    "",
    "- 해당 없음.",
    "",
    "## 변경 허용 경로",
    "",
    "```",
    ...allowedPaths,
    "```",
    "",
  ].join("\n");
  writeFixtureFile(root, radioPathOf(taskId), markdown);
  return createHash("sha256").update(Buffer.from(markdown)).digest("hex");
}

export function makeHandoffMarkdown(taskId: string): string {
  return [
    `# ${taskId} handoff`,
    "",
    "## 2026-08-03 · 개발 종료",
    "",
    `- 작업 식별자: ${taskId}`,
    "- 현재 단계: 개발 종료 → 다음 검증",
    "- 기준 시각: 2026-08-03",
    "",
    "### 확정된 사실",
    "",
    "- 게이트 구현을 마쳤다.",
    "",
    "### 미결 사항",
    "",
    "- 없음",
    "",
    "### 다음 행동",
    "",
    "1. 검증 명령을 실행한다.",
    "",
    "### 증거·산출물 경로",
    "",
    `- docs/execution/runs/${taskId}/tdd.json`,
    "",
  ].join("\n");
}

export type TddEntryInput = {
  command: string;
  exit_code: number;
  at: string;
  phase: string;
};

export function makeTddEvidence(command = "pnpm harness:self-test"): { entries: TddEntryInput[] } {
  return {
    entries: [
      { command, exit_code: 1, at: "2026-08-03T10:00:00+09:00", phase: "red" },
      { command, exit_code: 0, at: "2026-08-03T11:00:00+09:00", phase: "green" },
    ],
  };
}

export function git(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

export function initGitRepo(root: string): void {
  git(root, ["init", "--initial-branch=main"]);
  git(root, ["config", "user.email", "gate-self-test@example.com"]);
  git(root, ["config", "user.name", "gate self test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
}

export function createLoopFixtureRoot(): string {
  const root = createFixtureRoot();
  const source = resolveRepoRoot();
  cpSync(join(source, "harness", "lib"), join(root, "harness", "lib"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  copyFileSync(join(source, "scripts", "claude-loop.mjs"), join(root, "scripts", "claude-loop.mjs"));
  return root;
}

export type LoopRunResult = {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly signal: NodeJS.Signals | null;
};

export function runLoopCommand(
  root: string,
  args: readonly string[],
  options: {
    readonly env?: Readonly<Record<string, string>>;
    readonly timeout?: number;
    readonly input?: string;
  } = {},
): LoopRunResult {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      "scripts/claude-loop.mjs",
      ...args,
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, PATH: "", ...options.env },
      timeout: options.timeout ?? 15_000,
      input: options.input ?? "",
    },
  );
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    signal: result.signal ?? null,
  };
}

export function readLoopState(root: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, ".claude/runtime/loop-state.json"), "utf8"));
}

export function createFakeClaudeBin(root: string, posixScript: string): string {
  const binDir = join(root, "fake-bin");
  mkdirSync(binDir, { recursive: true });
  const claudePath = join(binDir, "claude");
  writeFileSync(claudePath, `#!/bin/sh\n${posixScript}\n`);
  chmodSync(claudePath, 0o755);
  return binDir;
}

export function createFakeClaudeAdapter(
  root: string,
  options: { readonly bgSessionId?: string; readonly respawnExitCode?: number } = {},
): { readonly binDir: string; readonly logPath: string } {
  const logPath = join(root, "fake-claude.log");
  const bgSessionId = options.bgSessionId ?? "fake-session-1";
  const respawnExitCode = options.respawnExitCode ?? 0;
  const script = [
    `printf '%s\\n' "$*" >> "${logPath}"`,
    `if [ "$1" = "--bg" ]; then echo "${bgSessionId}"; exit 0; fi`,
    `if [ "$1" = "respawn" ]; then exit ${respawnExitCode}; fi`,
    "exit 1",
  ].join("\n");
  const binDir = createFakeClaudeBin(root, script);
  return { binDir, logPath };
}

export function readFakeClaudeLog(logPath: string): string[] {
  try {
    return readFileSync(logPath, "utf8")
      .split("\n")
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
}
