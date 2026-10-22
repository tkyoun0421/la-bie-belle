import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type BoardLineRef = {
  file: string;
  line: number;
  text: string;
};

const ROOT_DOCS = ["CLAUDE.md", "README.md", "REVIEW.md"];
const SCANNED_DIRS = ["docs", ".claude"];
const RECORD_PREFIXES = [
  "docs/log/",
  "docs/observations/",
  ".claude/worktrees/",
];
const BOARD_LINE_REF =
  /(?:backlog|handoff|owner-todo)\.md(?:\)|`)?:\d+(?:[·,]\d+)*/g;

function markdownUnder(root: string, dir: string): string[] {
  if (!existsSync(path.join(root, dir))) {
    return [];
  }

  const entries = readdirSync(path.join(root, dir), {
    recursive: true,
  }) as string[];

  return entries
    .map((entry) => `${dir}/${entry.split(path.sep).join("/")}`)
    .filter((file) => file.endsWith(".md"));
}

export function scannedFiles(root: string): string[] {
  return [
    ...ROOT_DOCS.filter((doc) => existsSync(path.join(root, doc))),
    ...SCANNED_DIRS.flatMap((dir) => markdownUnder(root, dir)),
  ]
    .filter(
      (file) => !RECORD_PREFIXES.some((prefix) => file.startsWith(prefix)),
    )
    .sort();
}

export function boardLineRefs(file: string, markdown: string): BoardLineRef[] {
  return markdown.split("\n").flatMap((content, index) =>
    [...content.matchAll(BOARD_LINE_REF)].map((match) => ({
      file,
      line: index + 1,
      text: match[0],
    })),
  );
}

export function repositoryBoardLineRefs(root: string): BoardLineRef[] {
  return scannedFiles(root).flatMap((file) =>
    boardLineRefs(file, readFileSync(path.join(root, file), "utf8")),
  );
}
