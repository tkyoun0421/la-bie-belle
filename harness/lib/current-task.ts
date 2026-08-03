import { INDEX_PATH, readTextFile } from "./repo.ts";
import type { IndexEntry } from "./task-index.ts";
import { findInProgressTasks, parseIndexJsonl } from "./task-index.ts";
import type { Violation } from "./violation.ts";

export type IndexLoad =
  | { readonly ok: true; readonly entries: readonly IndexEntry[] }
  | { readonly ok: false; readonly violation: Violation };

export type CurrentTaskLoad =
  | { readonly ok: true; readonly task: IndexEntry | null }
  | { readonly ok: false; readonly violation: Violation };

/**
 * Reads the task index for gates that only need decoded records. Malformed lines
 * are skipped here on purpose: reporting them belongs to the index gate.
 */
export function loadIndexEntries(root: string, gate: string): IndexLoad {
  const indexText = readTextFile(root, INDEX_PATH);
  if (indexText === null) {
    return {
      ok: false,
      violation: {
        gate,
        file: INDEX_PATH,
        message: "task index 파일을 읽을 수 없습니다.",
        hint: `${INDEX_PATH} 경로에 index 파일이 있어야 합니다.`,
      },
    };
  }
  return { ok: true, entries: parseIndexJsonl(indexText).entries };
}

/**
 * Resolves the task the pipeline is currently executing: the single
 * `in_progress` task. Returns null when there is none, and also when there is
 * more than one — that ambiguity is the index gate's violation to report.
 */
export function loadCurrentTask(root: string, gate: string): CurrentTaskLoad {
  const loaded = loadIndexEntries(root, gate);
  if (!loaded.ok) {
    return loaded;
  }
  const inProgress = findInProgressTasks(loaded.entries);
  return { ok: true, task: inProgress.length === 1 ? (inProgress[0] ?? null) : null };
}
