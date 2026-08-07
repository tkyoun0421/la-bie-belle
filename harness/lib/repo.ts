import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const INDEX_PATH = "docs/execution/phases/index.jsonl";
export const INDEX_SCHEMA_PATH = "docs/execution/phases/index.schema.json";
export const RADIO_LENS_SNAPSHOT_PATH = "config/radio-lens.json";

export function resolveRepoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function repoPath(root: string, relativePath: string): string {
  return join(root, relativePath);
}

export function runPath(taskId: string, fileName: string): string {
  return `docs/execution/runs/${taskId}/${fileName}`;
}

export function readTextFile(root: string, relativePath: string): string | null {
  try {
    return readFileSync(repoPath(root, relativePath), "utf8");
  } catch {
    return null;
  }
}

export function sha256OfFile(root: string, relativePath: string): string | null {
  try {
    return createHash("sha256")
      .update(readFileSync(repoPath(root, relativePath)))
      .digest("hex");
  } catch {
    return null;
  }
}

export function listStagedFiles(root: string): string[] {
  const stdout = execFileSync("git", ["-C", root, "diff", "--cached", "--name-only", "-z"], {
    encoding: "utf8",
  });
  return stdout.split("\0").filter((entry) => entry.length > 0);
}

export type StagedFileChange = {
  readonly status: string;
  readonly path: string;
  readonly previousPath?: string;
};

export function listStagedFileChanges(root: string): StagedFileChange[] {
  const stdout = execFileSync("git", ["-C", root, "diff", "--cached", "--name-status", "-z"], {
    encoding: "utf8",
  });
  const fields = stdout.split("\0").filter((entry) => entry.length > 0);

  const changes: StagedFileChange[] = [];
  let cursor = 0;
  while (cursor < fields.length) {
    const status = fields[cursor];
    if (status === undefined) {
      break;
    }
    cursor += 1;

    if (status.startsWith("R") || status.startsWith("C")) {
      const previousPath = fields[cursor];
      const path = fields[cursor + 1];
      cursor += 2;
      if (previousPath === undefined || path === undefined) {
        break;
      }
      changes.push({ status, path, previousPath });
      continue;
    }

    const path = fields[cursor];
    cursor += 1;
    if (path === undefined) {
      break;
    }
    changes.push({ status, path });
  }
  return changes;
}
