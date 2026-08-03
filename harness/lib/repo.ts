import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository relative path of the task index. */
export const INDEX_PATH = "docs/execution/phases/index.jsonl";
/** Repository relative path of the task index schema. */
export const INDEX_SCHEMA_PATH = "docs/execution/phases/index.schema.json";

/**
 * Resolves the repository root from this module's own location, so gates behave
 * the same no matter which directory they are invoked from (git hooks, pnpm
 * scripts, self-test fixtures that hold their own copy of `harness/`).
 */
export function resolveRepoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function repoPath(root: string, relativePath: string): string {
  return join(root, relativePath);
}

/** Repository relative path of a per-task run artifact. */
export function runPath(taskId: string, fileName: string): string {
  return `docs/execution/runs/${taskId}/${fileName}`;
}

/** Reads a repository file as UTF-8 text, or returns null when it is missing. */
export function readTextFile(root: string, relativePath: string): string | null {
  try {
    return readFileSync(repoPath(root, relativePath), "utf8");
  } catch {
    return null;
  }
}

/** SHA-256 of a repository file's raw bytes, or null when it is missing. */
export function sha256OfFile(root: string, relativePath: string): string | null {
  try {
    return createHash("sha256").update(readFileSync(repoPath(root, relativePath))).digest("hex");
  } catch {
    return null;
  }
}

/** Repository relative paths of every file staged for the next commit. */
export function listStagedFiles(root: string): string[] {
  const stdout = execFileSync("git", ["-C", root, "diff", "--cached", "--name-only", "-z"], {
    encoding: "utf8",
  });
  return stdout.split("\0").filter((entry) => entry.length > 0);
}
