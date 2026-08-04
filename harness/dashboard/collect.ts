/**
 * Reads every source of truth the dashboard displays.
 *
 * This module owns all file system and git access; the calculation modules stay
 * pure. Nothing here writes: the dashboard is a derived, read only view. A
 * source that cannot be read becomes a notice, never a guessed value.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { checkCommitMessage } from "../lib/commit-msg-gate.ts";
import { REPOSITORY_GATES } from "../lib/gate-suite.ts";
import { INDEX_PATH, readTextFile, repoPath, runPath } from "../lib/repo.ts";
import type { IndexRecord } from "../lib/task-index.ts";
import { parseIndexJsonl } from "../lib/task-index.ts";
import { DASHBOARD_PATH } from "./render.ts";
import type { ReviewDocument } from "./reviews.ts";
import { BACKLOG_PATH, REVIEWS_DIRECTORY, isReviewFileName } from "./reviews.ts";
import type { ArtifactFreshness, EvidenceItem, GateOutcome } from "./rubric.ts";
import { selectEvidenceTasks } from "./rubric.ts";

const ADR_DIRECTORY = "docs/standards/adr";
const RUNS_DIRECTORY = "docs/execution/runs";
const INTERVIEWS_DIRECTORY = "interviews";
const PHASES_DIRECTORY = "docs/execution/phases";
const DASHBOARD_DIRECTORY = "docs/execution/dashboard";

/** Repository gates whose pass rate makes up the contract compliance score. */
const SCORED_GATE_IDS: readonly string[] = ["gate:index", "gate:radio", "gate:handoff", "gate:tdd"];

/** Base commit a generated artifact records for the next generation to read. */
const BASE_COMMIT_MARKER = /<meta name="base-commit" content="([0-9a-f]{40})">/u;

export type GitSnapshot = {
  readonly headCommit: string | null;
  readonly headSubject: string | null;
  readonly headMessage: string | null;
  readonly workingTreeNote: string;
};

export type OpenDebt = {
  readonly source: string;
  readonly items: readonly string[];
};

export type PendingAdr = {
  readonly file: string;
  readonly title: string;
  readonly state: string;
};

export type Collection = {
  readonly generatedAt: string;
  readonly git: GitSnapshot;
  readonly records: readonly IndexRecord[];
  /** Scored repository gates (index, radio, handoff, tdd). */
  readonly gates: readonly GateOutcome[];
  /** Commit-context gates (scope, commit-msg): reference display only. */
  readonly referenceGates: readonly GateOutcome[];
  readonly freshness: ArtifactFreshness;
  readonly evidence: readonly EvidenceItem[];
  readonly pendingAdrs: readonly PendingAdr[];
  readonly openDebts: readonly OpenDebt[];
  readonly reviewDocuments: readonly ReviewDocument[];
  readonly backlogMarkdown: string | null;
  readonly notices: readonly string[];
};

function git(root: string, args: readonly string[]): string | null {
  try {
    // A missing HEAD or artifact is an expected state ("누락"), so git's own
    // stderr message must not leak into the generator output.
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function readGit(root: string, notices: string[]): GitSnapshot {
  const head = git(root, ["rev-parse", "HEAD"]);
  const message = git(root, ["log", "-1", "--pretty=%B"]);
  const status = git(root, ["status", "--porcelain"]);

  if (head === null) {
    notices.push("git HEAD를 읽지 못했습니다. 기준 커밋을 누락으로 표시합니다.");
  }
  let workingTreeNote = "작업 트리 상태를 확인하지 못했습니다.";
  if (status !== null) {
    const changed = status.split("\n").filter((line) => line.trim().length > 0).length;
    workingTreeNote =
      changed === 0
        ? "커밋되지 않은 변경 없음 — 표시 내용이 기준 커밋과 일치한다."
        : `커밋되지 않은 변경 ${changed}건 — 표시 내용에 기준 커밋 이후의 작업 트리 상태가 섞여 있다.`;
  }

  return {
    headCommit: head === null ? null : head.trim(),
    headSubject: message === null ? null : (message.split("\n")[0] ?? "").trim(),
    headMessage: message,
    workingTreeNote,
  };
}

/** Runs one gate; a gate that cannot run becomes a not-passed outcome, never an abort. */
function runGate(id: string, run: () => number, notices: string[]): GateOutcome {
  try {
    const violations = run();
    return { id, passed: violations === 0, violations };
  } catch (error) {
    const reason = (error as Error).message.split("\n")[0] ?? "알 수 없는 오류";
    notices.push(`${id} 실행에 실패했습니다(${reason}). 통과로 보지 않습니다.`);
    return { id, passed: false, violations: 0, errored: true };
  }
}

/**
 * Runs every repository gate plus commit-msg over the HEAD commit message, split
 * into the scored repository gates and the commit-context reference gates.
 */
function runGates(
  root: string,
  headMessage: string | null,
  notices: string[],
): { scored: GateOutcome[]; reference: GateOutcome[] } {
  const outcomes = REPOSITORY_GATES.map((gate) => runGate(gate.id, () => gate.run(root).length, notices));

  if (headMessage === null) {
    notices.push("HEAD 커밋 메시지를 읽지 못해 commit-msg 게이트를 통과로 볼 수 없습니다.");
    outcomes.push({ id: "commit-msg", passed: false, violations: 0, errored: true });
  } else {
    outcomes.push(runGate("commit-msg", () => checkCommitMessage(headMessage).length, notices));
  }
  return {
    scored: outcomes.filter((outcome) => SCORED_GATE_IDS.includes(outcome.id)),
    reference: outcomes.filter((outcome) => !SCORED_GATE_IDS.includes(outcome.id)),
  };
}

/**
 * Judges the ADR-0012 regeneration rule: reads the base commit recorded in the
 * previously committed artifact and checks whether any commit since then changed
 * `docs/execution/phases/` without also regenerating the dashboard.
 */
export function artifactFreshness(root: string, headCommit: string | null): ArtifactFreshness {
  if (headCommit === null) {
    return { kind: "no-head" };
  }
  const previous = git(root, ["show", `HEAD:${DASHBOARD_PATH}`]);
  if (previous === null) {
    return { kind: "no-previous" };
  }
  const recordedCommit = BASE_COMMIT_MARKER.exec(previous)?.[1];
  if (recordedCommit === undefined) {
    return { kind: "unreadable" };
  }
  if (recordedCommit === headCommit) {
    return { kind: "fresh", recordedCommit };
  }
  const listed = git(root, ["rev-list", `${recordedCommit}..HEAD`, "--", PHASES_DIRECTORY]);
  if (listed === null) {
    return { kind: "unreadable" };
  }
  const missedCommits = listed
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .filter((commit) => {
      const files = git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit]);
      return files === null || !files.split("\n").some((file) => file.startsWith(`${DASHBOARD_DIRECTORY}/`));
    })
    .map((commit) => commit.slice(0, 7));
  if (missedCommits.length === 0) {
    return { kind: "fresh", recordedCommit };
  }
  return { kind: "stale", recordedCommit, missedCommits };
}

function readIndexRecords(root: string, notices: string[]): IndexRecord[] {
  const text = readTextFile(root, INDEX_PATH);
  if (text === null) {
    notices.push(`${INDEX_PATH}를 읽지 못했습니다. 진행도와 추천을 표시할 수 없습니다.`);
    return [];
  }
  const parsed = parseIndexJsonl(text);
  for (const error of parsed.parseErrors) {
    notices.push(`${INDEX_PATH}:${error.line} ${error.message}`);
  }
  return parsed.entries.map((entry) => entry.record);
}

/** Existence of the run artifacts each completed task must carry. */
function collectEvidence(root: string, records: readonly IndexRecord[]): EvidenceItem[] {
  return selectEvidenceTasks(records).flatMap((task) => {
    const items: EvidenceItem[] = [
      {
        taskId: task.taskId,
        requirement: "handoff",
        present: existsSync(repoPath(root, runPath(task.taskId, "handoff.md"))),
      },
    ];
    if (task.requiresTdd) {
      items.push({
        taskId: task.taskId,
        requirement: "tdd",
        present: existsSync(repoPath(root, runPath(task.taskId, "tdd.json"))),
      });
    }
    return items;
  });
}

function listDirectory(root: string, relativePath: string): string[] {
  try {
    return readdirSync(repoPath(root, relativePath)).sort();
  } catch {
    return [];
  }
}

const ADR_STATE_LINE = /^-\s*상태:\s*(.+?)\s*$/mu;
const ADR_TITLE_LINE = /^#\s+(.+?)\s*$/mu;

/** ADRs whose state line says 보류: they are not a current implementation basis. */
function collectPendingAdrs(root: string): PendingAdr[] {
  return listDirectory(root, ADR_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".md") && fileName !== "README.md")
    .flatMap((fileName) => {
      const path = `${ADR_DIRECTORY}/${fileName}`;
      const markdown = readTextFile(root, path);
      if (markdown === null) {
        return [];
      }
      const state = ADR_STATE_LINE.exec(markdown)?.[1] ?? "";
      if (!state.includes("보류")) {
        return [];
      }
      return [{ file: path, title: ADR_TITLE_LINE.exec(markdown)?.[1] ?? fileName, state }];
    });
}

const UNRESOLVED_HEADING = /^#{2,6}\s*미결 사항\s*$/u;
const HEADING = /^#{1,6}\s/u;
const LIST_ITEM = /^[-*]\s+(.+)$/u;

/**
 * Reads the last `미결 사항` section of a handoff. Only the newest stage record
 * counts: earlier sections describe debt that a later record already restated or
 * resolved. A single `없음` item means no debt.
 */
export function parseOpenDebtItems(markdown: string): string[] {
  const lines = markdown.split("\n");
  let start = -1;
  for (let offset = 0; offset < lines.length; offset += 1) {
    if (UNRESOLVED_HEADING.test(lines[offset] ?? "")) {
      start = offset;
    }
  }
  if (start < 0) {
    return [];
  }
  const items: string[] = [];
  for (let cursor = start + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor] ?? "";
    if (HEADING.test(line)) {
      break;
    }
    const matched = LIST_ITEM.exec(line.trim());
    if (matched === null) {
      continue;
    }
    const text = matched[1] ?? "";
    if (text.startsWith("없음")) {
      continue;
    }
    items.push(text);
  }
  return items;
}

function handoffPaths(root: string): string[] {
  const paths: string[] = [];
  for (const entry of listDirectory(root, RUNS_DIRECTORY)) {
    const relativePath = `${RUNS_DIRECTORY}/${entry}`;
    let isDirectory = false;
    try {
      isDirectory = statSync(repoPath(root, relativePath)).isDirectory();
    } catch {
      isDirectory = false;
    }
    if (!isDirectory) {
      continue;
    }
    if (entry === INTERVIEWS_DIRECTORY) {
      paths.push(
        ...listDirectory(root, relativePath)
          .filter((fileName) => fileName.endsWith(".md"))
          .map((fileName) => `${relativePath}/${fileName}`),
      );
      continue;
    }
    if (existsSync(join(repoPath(root, relativePath), "handoff.md"))) {
      paths.push(`${relativePath}/handoff.md`);
    }
  }
  return paths;
}

function collectOpenDebts(root: string): OpenDebt[] {
  return handoffPaths(root).flatMap((path) => {
    const markdown = readTextFile(root, path);
    if (markdown === null) {
      return [];
    }
    const items = parseOpenDebtItems(markdown);
    return items.length === 0 ? [] : [{ source: path, items }];
  });
}

function collectReviewDocuments(root: string, notices: string[]): ReviewDocument[] {
  return listDirectory(root, REVIEWS_DIRECTORY)
    .filter(isReviewFileName)
    .flatMap((fileName) => {
      const path = `${REVIEWS_DIRECTORY}/${fileName}`;
      try {
        return [{ file: path, text: readFileSync(repoPath(root, path), "utf8") }];
      } catch {
        notices.push(`${path}를 읽지 못했습니다.`);
        return [];
      }
    });
}

/** Gathers one consistent snapshot of the repository at `now`. */
export function collect(root: string, now: Date): Collection {
  const notices: string[] = [];
  const gitSnapshot = readGit(root, notices);
  const records = readIndexRecords(root, notices);
  const backlogMarkdown = readTextFile(root, BACKLOG_PATH);
  if (backlogMarkdown === null) {
    notices.push(`${BACKLOG_PATH}를 읽지 못했습니다. backlog를 표시할 수 없습니다.`);
  }

  const gateResults = runGates(root, gitSnapshot.headMessage, notices);

  return {
    generatedAt: now.toISOString(),
    git: gitSnapshot,
    records,
    gates: gateResults.scored,
    referenceGates: gateResults.reference,
    freshness: artifactFreshness(root, gitSnapshot.headCommit),
    evidence: collectEvidence(root, records),
    pendingAdrs: collectPendingAdrs(root),
    openDebts: collectOpenDebts(root),
    reviewDocuments: collectReviewDocuments(root, notices),
    backlogMarkdown,
    notices,
  };
}
