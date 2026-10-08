import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const SCOPES = ["src", "tests", "scripts", "eslint-rules"];

export const EXCLUDED_PREFIXES = ["src/app/"];

const NO_HOOK_DETECTION = ["tests/"];

const EXTENSIONS = [".ts", ".tsx", ".mts", ".mjs", ".js"];

export type NameStyle = "camel" | "pascal" | "hook";

const HOOK_EXPORT =
  /^\s*export\s+(?:async\s+)?(?:function|const)\s+(use[A-Z]\w*)/m;

const STORES_SEGMENT_FILE = /(?:^|\/)stores\/[^/]+\.(?:store|context)\.ts$/;

export function stemOf(base: string): string {
  const dot = base.indexOf(".");

  return dot === -1 ? base : base.slice(0, dot);
}

export function styleFor(file: string, source: string): NameStyle {
  if (file.endsWith(".tsx")) {
    return "pascal";
  }

  if (STORES_SEGMENT_FILE.test(file)) {
    return "camel";
  }

  const detect = !NO_HOOK_DETECTION.some((prefix) => file.startsWith(prefix));

  return detect && HOOK_EXPORT.test(source) ? "hook" : "camel";
}

export function matchesStyle(stem: string, style: NameStyle): boolean {
  if (style === "pascal") {
    return /^[A-Z][a-zA-Z0-9]*$/.test(stem);
  }

  if (style === "hook") {
    return /^use[A-Z][a-zA-Z0-9]*$/.test(stem);
  }

  return /^[a-z][a-zA-Z0-9]*$/.test(stem);
}

function words(stem: string): string[] {
  return stem
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

export function toStyle(stem: string, style: NameStyle): string {
  const pascal = words(stem)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");

  if (style === "pascal") {
    return pascal;
  }

  if (style === "hook") {
    return pascal.startsWith("Use") ? `use${pascal.slice(3)}` : `use${pascal}`;
  }

  return pascal[0].toLowerCase() + pascal.slice(1);
}

export type FileNamingViolation =
  | { type: "style"; file: string; style: NameStyle; suggestion: string }
  | { type: "folder"; folder: string; suggestion: string }
  | { type: "case-collision"; files: string[] };

export type CodeFile = { file: string; source: string };

function inScope({ file }: CodeFile): boolean {
  return (
    EXTENSIONS.some((extension) => file.endsWith(extension)) &&
    !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix))
  );
}

const PAIR_TEST = /\.(?:integration\.)?test\.tsx?$/;

const PAIR_DIRECTORY = "__tests__";

function subjectOf(file: string, files: CodeFile[]): CodeFile | undefined {
  const directory = path.posix.dirname(file);

  if (
    !PAIR_TEST.test(file) ||
    path.posix.basename(directory) !== PAIR_DIRECTORY
  ) {
    return undefined;
  }

  const stem = stemOf(path.posix.basename(file));
  const beside = path.posix.dirname(directory);

  return files.find(({ file: candidate }) =>
    EXTENSIONS.some(
      (extension) => candidate === path.posix.join(beside, stem + extension),
    ),
  );
}

function isOrphanHookTest(file: string): boolean {
  return (
    PAIR_TEST.test(file) &&
    path.posix.basename(path.posix.dirname(file)) === PAIR_DIRECTORY &&
    matchesStyle(stemOf(path.posix.basename(file)), "hook")
  );
}

export function styleViolations(files: CodeFile[]): FileNamingViolation[] {
  const inspected = files.filter(inScope);

  return inspected.flatMap(({ file, source }) => {
    const base = path.basename(file);
    const stem = stemOf(base);
    const subject = subjectOf(file, inspected);
    const style = subject
      ? styleFor(subject.file, subject.source)
      : isOrphanHookTest(file)
        ? "hook"
        : styleFor(file, source);

    if (matchesStyle(stem, style)) {
      return [];
    }

    return [
      {
        type: "style" as const,
        file,
        style,
        suggestion: path.posix.join(
          path.posix.dirname(file),
          toStyle(stem, style) + base.slice(stem.length),
        ),
      },
    ];
  });
}

const EXCLUDED_FOLDER_NAMES = ["__tests__"];

export function folderViolations(files: CodeFile[]): FileNamingViolation[] {
  const folders = new Set<string>();

  for (const { file } of files.filter(inScope)) {
    let directory = path.posix.dirname(file);

    while (directory.includes("/")) {
      folders.add(directory);
      directory = path.posix.dirname(directory);
    }
  }

  return [...folders]
    .sort()
    .filter((folder) => {
      const name = path.posix.basename(folder);

      return (
        !EXCLUDED_FOLDER_NAMES.includes(name) && !matchesStyle(name, "camel")
      );
    })
    .map((folder) => ({
      type: "folder" as const,
      folder,
      suggestion: path.posix.join(
        path.posix.dirname(folder),
        toStyle(path.posix.basename(folder), "camel"),
      ),
    }));
}

export function caseCollisions(files: CodeFile[]): FileNamingViolation[] {
  const byLowered = new Map<string, string[]>();

  for (const { file } of files) {
    const key = file.toLowerCase();

    byLowered.set(key, [...(byLowered.get(key) ?? []), file]);
  }

  return [...byLowered.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({ type: "case-collision", files: group.sort() }));
}

export function fileNamingViolations(files: CodeFile[]): FileNamingViolation[] {
  return [
    ...styleViolations(files),
    ...folderViolations(files),
    ...caseCollisions(files),
  ];
}

const REASONS: Record<NameStyle, string> = {
  camel: "이름이 camelCase가 아니다",
  pascal: "`.tsx`라 컴포넌트고 그 이름은 PascalCase다",
  hook: "훅을 내놓으니 이름이 그 훅 이름과 같아야 한다",
};

export function describeFileNamingViolation(
  violation: FileNamingViolation,
): string {
  if (violation.type === "case-collision") {
    return `${violation.files.join("과 ")}가 케이스만 다르다 — macOS와 윈도우에서 한 파일이 돼 체크아웃이 깨진다.`;
  }

  if (violation.type === "folder") {
    return `${violation.folder}의 이름이 camelCase가 아니다 — ${violation.suggestion}로 옮겨라.`;
  }

  return `${violation.file}의 ${REASONS[violation.style]} — ${violation.suggestion}로 옮겨라.`;
}

function walk(root: string, relative: string, into: string[]) {
  for (const entry of readdirSync(path.join(root, relative), {
    withFileTypes: true,
  })) {
    const next = path.posix.join(relative, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".")) {
        walk(root, next, into);
      }
    } else {
      into.push(next);
    }
  }
}

export function repositoryCodeFiles(root: string = process.cwd()): CodeFile[] {
  const found: string[] = [];

  for (const scope of SCOPES) {
    walk(root, scope, found);
  }

  return found
    .filter((file) => EXTENSIONS.some((extension) => file.endsWith(extension)))
    .map((file) => ({
      file,
      source: readFileSync(path.join(root, file), "utf8"),
    }));
}

export function repositoryFileNamingViolations(
  root: string = process.cwd(),
): FileNamingViolation[] {
  return fileNamingViolations(repositoryCodeFiles(root));
}
