import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { INDEX_PATH, INDEX_SCHEMA_PATH, repoPath, resolveRepoRoot } from "../lib/repo.ts";
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

/**
 * Creates a throwaway repository-shaped directory that already contains the real
 * `index.schema.json`, so schema behaviour in tests matches the real contract.
 * Every fixture root is removed when the test process exits.
 */
export function createFixtureRoot(): string {
  registerCleanup();
  const root = mkdtempSync(join(tmpdir(), "lbb-gate-"));
  createdRoots.push(root);
  mkdirSync(join(root, dirname(INDEX_SCHEMA_PATH)), { recursive: true });
  copyFileSync(repoPath(resolveRepoRoot(), INDEX_SCHEMA_PATH), join(root, INDEX_SCHEMA_PATH));
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

/** Writes `index.jsonl` with one JSON object per line. */
export function writeIndexRecords(root: string, records: readonly unknown[]): void {
  writeFixtureFile(root, INDEX_PATH, toJsonLines(records));
}

/** Parses records into index entries without touching the file system. */
export function indexEntriesOf(records: readonly unknown[]): readonly IndexEntry[] {
  return parseIndexJsonl(toJsonLines(records)).entries;
}

/** Joins violation messages so assertions can match on the whole report. */
export function joinMessages(violations: readonly Violation[]): string {
  return violations.map((violation) => violation.message).join("\n");
}

/** Writes raw `index.jsonl` text, for malformed-input fixtures. */
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

/** Writes a RADIO document for `taskId` and returns its SHA-256. */
export function writeRadio(root: string, taskId: string, allowedPaths: readonly string[]): string {
  const markdown = makeRadioMarkdown(allowedPaths);
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

/** Initialises a git repository with a deterministic identity for commit tests. */
export function initGitRepo(root: string): void {
  git(root, ["init", "--initial-branch=main"]);
  git(root, ["config", "user.email", "gate-self-test@example.com"]);
  git(root, ["config", "user.name", "gate self test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
}
