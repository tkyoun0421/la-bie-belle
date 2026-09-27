/**
 * 코드 파일 이름이 규약대로인지 본다 — 컴포넌트는 PascalCase, 훅은 camelCase,
 * 나머지는 kebab-case다.
 *
 * **무엇이 들었는지가 갈래를 정한다.** [ADR-001](../../docs/2-design/adr/ADR-001-code-structure-and-tdd.md)이
 * `.tsx`를 더미 UI로 못박아서 이 저장소에서 `.tsx`는 곧 컴포넌트고, 컴포넌트는 JSX 안에서
 * `<NotBuiltYet />`으로 불린다. 훅은 `useSomething()`으로 불린다. 둘 다 부르는 이름이 있고
 * 파일 이름이 그것과 같아야 코드에서 파일로 바로 건너간다. 부르는 이름이 없는 파일만
 * kebab-case다.
 *
 * **케이스가 다른 두 파일이 겹치는 것도 같이 본다.** macOS와 윈도우는 대소문자를 안 구별해서
 * `Foo.ts`와 `foo.ts`가 OS에는 한 파일, git에는 두 파일이다 — 체크아웃이 인덱스와 어긋난다.
 * kebab으로 통일하면 그 차원이 아예 없어지는데 컴포넌트를 PascalCase로 두면 다시 들어온다.
 * 그 위험을 이 검사가 대신 막는다.
 *
 * **`src/app/`은 밖이다.** Expo Router가 파일 이름을 URL로 읽는다 — `check-in.tsx`가
 * `/check-in`이고 그 주소는 종이 QR에 실려 나간다([navigation.md](../../docs/2-design/system/navigation.md#딥링크)).
 * 거기 `.tsx`는 컴포넌트가 아니라 화면 문서가 정한 주소다. Expo Router 문서는 라우트 파일의
 * 케이스를 규정하지 않아서 이 판단은 우리 것이다.
 *
 * **짝 테스트는 대상의 이름을 따른다.** `__tests__/` 안의 `*.test.ts`는 제 내용이 아니라
 * 옆에서 재는 파일의 갈래로 본다 — `useMyProfile.ts`의 짝은 `useMyProfile.test.ts`고,
 * 그 이름으로 짝을 찾는 것이 `.claude/hooks/tdd-guard-unit.py`다.
 *
 * `.claude/hooks/`도 밖이다 — 파이썬 훅이 그 생태계 표준인 snake_case를 쓰고, 짝 테스트가
 * 그 이름을 그대로 따라야 무엇의 테스트인지 읽힌다. `docs/`와 슬러그는
 * [ADR-005](../../docs/2-design/adr/ADR-005-feature-chain-and-slug.md)가 소유한다.
 *
 * 이름 하나가 어긋나도 아무것도 안 깨져서 리뷰가 놓치면 그대로 들어온다 — 그래서 기계가 본다.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** 이름을 우리가 고르는 코드가 사는 자리. */
export const SCOPES = ["src", "tests", "scripts", "eslint-rules"];

export const EXCLUDED_PREFIXES = ["src/app/"];

/**
 * 훅 판정을 안 하는 자리. `tests/`의 픽스처가 잡히려고 훅 코드를 글자로 들고 있다 —
 * 내용으로 판정하면 그 검사 파일들이 전부 훅으로 읽힌다.
 */
const NO_HOOK_DETECTION = ["tests/"];

const EXTENSIONS = [".ts", ".tsx", ".mts", ".mjs", ".js"];

export type NameStyle = "kebab" | "pascal" | "hook";

const HOOK_EXPORT =
  /^\s*export\s+(?:async\s+)?(?:function|const)\s+(use[A-Z]\w*)/m;

/** 확장자 앞의 첫 조각. `check-in.integration.test.ts`면 `check-in`이다. */
export function stemOf(base: string): string {
  const dot = base.indexOf(".");

  return dot === -1 ? base : base.slice(0, dot);
}

export function styleFor(file: string, source: string): NameStyle {
  if (file.endsWith(".tsx")) {
    return "pascal";
  }

  const detect = !NO_HOOK_DETECTION.some((prefix) => file.startsWith(prefix));

  return detect && HOOK_EXPORT.test(source) ? "hook" : "kebab";
}

export function matchesStyle(stem: string, style: NameStyle): boolean {
  if (style === "pascal") {
    return /^[A-Z][a-zA-Z0-9]*$/.test(stem);
  }

  if (style === "hook") {
    return /^use[A-Z][a-zA-Z0-9]*$/.test(stem);
  }

  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(stem);
}

function words(stem: string): string[] {
  return stem
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

/** 어긋난 이름을 규약에 맞춘 꼴로 옮긴다. */
export function toStyle(stem: string, style: NameStyle): string {
  const parts = words(stem);

  if (style === "kebab") {
    return parts.join("-");
  }

  const pascal = parts
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");

  if (style === "pascal") {
    return pascal;
  }

  return pascal.startsWith("Use") ? `use${pascal.slice(3)}` : `use${pascal}`;
}

export type FileNamingViolation =
  | { type: "style"; file: string; style: NameStyle; suggestion: string }
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

/**
 * 짝 테스트의 갈래는 자기 내용이 아니라 재는 대상의 갈래다. `useMyProfile.ts`의 짝은
 * `useMyProfile.test.ts`여야 하는데(`.claude/hooks/tdd-guard-unit.py`가 그 이름으로 짝을
 * 찾는다) 테스트 파일 자체는 훅을 안 내놓아 내용으로 보면 kebab으로 읽힌다 — 두 규칙이
 * 서로 다른 이름을 요구하게 된다. 대상을 찾아 그쪽 갈래를 물린다.
 */
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

/**
 * 대상이 아직 없는 `__tests__/useX.test.ts`. TDD라 테스트가 훅보다 먼저 서는데, 그 사이
 * 이 검사가 kebab을 요구하면 writer는 kebab으로 짓고 implementer는 훅을 만들면서 다시
 * 이름을 바꿔야 했다 — 세 task에서 같은 마찰이 났다. `use` 뒤에 대문자가 오는 줄기는
 * 훅 짝으로 읽고, 실제 훅이 서면 그때 `subjectOf`가 대상의 갈래를 물린다.
 */
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

/** 케이스만 달라 대소문자를 안 구별하는 파일 시스템에서 한 파일이 되는 짝. */
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
  return [...styleViolations(files), ...caseCollisions(files)];
}

const REASONS: Record<NameStyle, string> = {
  kebab: "이름이 kebab-case가 아니다",
  pascal: "`.tsx`라 컴포넌트고 그 이름은 PascalCase다",
  hook: "훅을 내놓으니 이름이 그 훅 이름과 같아야 한다",
};

export function describeFileNamingViolation(
  violation: FileNamingViolation,
): string {
  if (violation.type === "case-collision") {
    return `${violation.files.join("과 ")}가 케이스만 다르다 — macOS와 윈도우에서 한 파일이 돼 체크아웃이 깨진다.`;
  }

  return `${violation.file}의 ${REASONS[violation.style]} — ${violation.suggestion}로 옮겨라.`;
}

/**
 * 점으로 시작하는 디렉터리는 안 본다. 이름을 우리가 고르는 코드가 아니라 도구가 만들었다
 * 지우는 자리다 — `format-check.test.ts`가 쓰는 `tests/lint/.tmp-format-check`이 그렇고,
 * 그 검사와 이 검사가 같이 돌면 지워지기 전의 임시 파일이 위반으로 잡힌다.
 */
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
