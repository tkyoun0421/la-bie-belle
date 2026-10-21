import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type LegacyPathViolation = {
  file: string;
  pattern: string;
  line: number;
};

const DOCS = "docs/";

const DESIGN = `${DOCS}2-design/`;

const LEGACY_PATHS = [
  `${DOCS}plan.md`,
  `${DOCS}prd.md`,
  `${DOCS}domain`,
  `${DOCS}adr/`,
  `${DOCS}spec/`,
  `${DOCS}design-system/`,
  `${DESIGN}domain/`,
  `${DESIGN}architecture/`,
  `${DESIGN}design-system/pages/`,
];

const HISTORY_ROOTS = ["src", "scripts", "tests"];

const SOURCE_ROOT = "src/";

const SOURCE_LAYER_FILE =
  /^(?:app|screens|features|entities|shared)\/.+\.tsx?$/;

function gitOutput(repo: string, args: string[]): string {
  const result = spawnSync(
    "git",
    ["-C", repo, "-c", "core.quotePath=false", ...args],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );

  if (result.error || result.status !== 0) {
    const reason = result.error?.message ?? result.stderr.trim();
    throw new Error(
      `${repo}에서 git ${args.join(" ")}을 못 돌렸다. 이름 변경 기록은 git 이력에서 읽는다: ${reason}`,
    );
  }

  return result.stdout;
}

export function pathsRenamedAway(repo: string): string[] {
  const shallow = gitOutput(repo, ["rev-parse", "--is-shallow-repository"]);
  if (shallow.trim() === "true") {
    throw new Error(
      `${repo}는 얕은 clone이라 이름 변경 기록을 못 읽는다. git fetch --unshallow로 이력을 다 받은 뒤 다시 돌린다.`,
    );
  }

  const renameLog = gitOutput(repo, [
    "log",
    "--diff-filter=R",
    "--name-status",
    "--format=",
    "-M",
    "--",
    ...HISTORY_ROOTS,
  ]);
  const renamedAway = new Set(
    renameLog
      .split("\n")
      .map((line) => line.split("\t"))
      .filter((columns) => columns.length === 3)
      .map(([, from]) => from),
  );

  if (renamedAway.size === 0) {
    throw new Error(
      `${repo}의 ${HISTORY_ROOTS.join("·")} 이름 변경 기록이 비었다. 이력이 잘렸는지 본다.`,
    );
  }

  return [...renamedAway];
}

type FindInLine = (line: string) => string[];

const NAME_CHARACTER = /[\w-]/;

const BEFORE_STANDALONE = /[\w.-]/;

const BEFORE_LAYER_RELATIVE = /[\w./-]/;

function leadingWordOf(pattern: string): string {
  return /^[\w-]*/.exec(pattern)?.[0] ?? "";
}

function standaloneFinder(
  patterns: string[],
  before = BEFORE_STANDALONE,
): FindInLine {
  const wanted = new Set(patterns);
  const leadingWords = new Set(patterns.map(leadingWordOf));
  const longest = Math.max(0, ...patterns.map((pattern) => pattern.length));

  return (line) => {
    const found: string[] = [];

    for (const word of line.matchAll(/[\w-]+/g)) {
      const start = word.index;
      if (!leadingWords.has(word[0]) || before.test(line[start - 1] ?? "")) {
        continue;
      }

      const last = Math.min(line.length, start + longest);
      for (let end = start + word[0].length; end <= last; end += 1) {
        const candidate = line.slice(start, end);
        if (!NAME_CHARACTER.test(line[end] ?? "") && wanted.has(candidate)) {
          found.push(candidate);
        }
      }
    }

    return found;
  };
}

const SIBLING_RUN = /`([^`\s]*\/)[^`\s/]+`((?:\s*[·,]\s*`[^`\s/]+`)+)/g;

const SIBLING_NAME = /`([^`]+)`/g;

const LEADING_RELATIVE = /^(?:\.\.?\/)+/;

function siblingPathsIn(line: string): string[] {
  return [...line.matchAll(SIBLING_RUN)].flatMap(([, folder, names]) =>
    [...names.matchAll(SIBLING_NAME)].map(
      ([, name]) => `${folder.replace(LEADING_RELATIVE, "")}${name}`,
    ),
  );
}

type RenamedPatterns = {
  inEveryFile: FindInLine;
  outsideCode: FindInLine;
  layerRelative: FindInLine;
  siblingTargets: Set<string>;
};

function renamedPatternsFor(
  presentFiles: string[],
  renamedAway: string[],
): RenamedPatterns {
  const present = new Set(presentFiles);
  const presentNames = new Set(presentFiles.map((file) => path.basename(file)));
  const gone = renamedAway.filter((oldPath) => !present.has(oldPath));

  const nameOrPath = (oldPath: string) => {
    const name = path.basename(oldPath);
    return presentNames.has(name) ? oldPath : name;
  };
  const outsideSource = gone
    .filter((oldPath) => !oldPath.startsWith(SOURCE_ROOT))
    .map(nameOrPath);
  const insideSource = gone.filter((oldPath) =>
    oldPath.startsWith(SOURCE_ROOT),
  );
  const layerRelative = insideSource
    .map((oldPath) => oldPath.slice(SOURCE_ROOT.length))
    .filter((layerPath) => SOURCE_LAYER_FILE.test(layerPath));

  return {
    inEveryFile: standaloneFinder(outsideSource),
    outsideCode: standaloneFinder(insideSource),
    layerRelative: standaloneFinder(layerRelative, BEFORE_LAYER_RELATIVE),
    siblingTargets: new Set(
      [...outsideSource, ...insideSource, ...layerRelative].filter((pattern) =>
        pattern.includes("/"),
      ),
    ),
  };
}

function fileName(stem: string, extension: string): string {
  return `${stem}${extension}`;
}

const OLD_SEED_SESSION = fileName("seed-session", ".js");

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".mjs", ".js"]);

const SCANNED_ROOTS = [
  "CLAUDE.md",
  ".claude",
  ".github",
  ".githooks",
  "docs",
  "eslint-rules",
  "scripts",
  "src",
  "supabase",
  "tests",
];

const EXCLUDED_PREFIXES = [`${DOCS}log/`, ".claude/worktrees/"];

const SKIPPED_DIRECTORIES = new Set(["node_modules", "__pycache__"]);

const BINARY_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".otf",
  ".pdf",
  ".png",
  ".pyc",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);

export type AllowedLine = {
  file: string;
  marker: string;
};

export const ALLOWED_LINES: AllowedLine[] = [
  {
    file: "docs/2-design/adr/ADR-004-domain-rules-home.md",
    marker: "디렉터리로 연다",
  },
  {
    file: "docs/3-build/plans/sdlc-gate.md",
    marker: "옮기기 전 경로",
  },
  {
    file: "docs/2-design/adr/ADR-002-sdd-ddd-tdd.md",
    marker: `\`${DESIGN}domain/`,
  },
  {
    file: "docs/2-design/adr/ADR-004-domain-rules-home.md",
    marker: `${DESIGN}domain/`,
  },
  {
    file: "docs/3-build/plans/session-foundation.md",
    marker: `\`${DESIGN}domain/account.md\``,
  },
  {
    file: "docs/3-build/plans/doc-map-links.md",
    marker: `\`${DESIGN}architecture/README.md\``,
  },
  {
    file: "docs/proposals/docs-structure-followup.md",
    marker: "**수정 대상.**",
  },
  {
    file: "tests/lint/e2eFileReferences.test.ts",
    marker: `reference: "scripts/${OLD_SEED_SESSION}"`,
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'camelWanted: "src/shared/api/',
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'camelWantedTest: "tests/lint/',
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'expect(stemOf("database-',
  },
  {
    file: "docs/3-build/plans/schedule-data.md",
    marker: "디렉터리가 없어",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker:
      "[.claude/agents/sian-auditor.md](../../.claude/agents/sian-auditor.md):27",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker: "가리키는 자리가 그 결과다",
  },
  {
    file: "docs/backlog.md",
    marker: "`legacy-bare-script-names`",
  },
  {
    file: "tests/lint/e2eFileReferences.test.ts",
    marker: `"seedSession.js", "${OLD_SEED_SESSION}")`,
  },
  {
    file: "docs/backlog.md",
    marker: "`legacy-intermediate-names`",
  },
  {
    file: "docs/observations/035-edge-function-reaches-outside-mount.md",
    marker: '} from "../../../src/features/payroll/model/',
  },
  {
    file: "docs/observations/050-comment-paths-checked-by-nothing.md",
    marker: "useQrCodeQuery.test.ts:4",
  },
  {
    file: "docs/observations/050-comment-paths-checked-by-nothing.md",
    marker: "// 구현 대상: ",
  },
  {
    file: "docs/observations/050-comment-paths-checked-by-nothing.md",
    marker: "그 파일은 `",
  },
  {
    file: "docs/observations/051-reexport-bypasses-segment-checks.md",
    marker: "monthState.policy.ts:52",
  },
  {
    file: "docs/observations/archive/006-tdd-guard-e2e-screens-ts.md",
    marker: "login-screens 회차에서 unit-test-writer가",
  },
  {
    file: "docs/observations/archive/030-export-gate-needs-complete-writer-assignment.md",
    marker: "TDD 차단: ",
  },
  {
    file: "docs/observations/archive/039-e2e-only-assignment-blocks-the-hook.md",
    marker: "를 만들려다 멈췄다",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker: "(../4-test/evidence/expo-scaffold.md):36",
  },
  {
    file: "docs/proposals/post-refactor-audit.md",
    marker: "pressNotification.ts:20",
  },
  {
    file: "docs/proposals/post-refactor-audit.md",
    marker: "폴더에 훅이 아닌 함수 파일",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "는 세 줄이고 `qrcode` 패키지를",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "는 `navigate`와 `markRead`를 인자로 받아",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "자리는 그대로고 `shared/utils`로 올라간다",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "흐름이 `hooks`로 간다",
  },
  {
    file: "docs/3-build/plans/reexport-launders-layers.md",
    marker: "monthState.policy.ts:35",
  },
  {
    file: "docs/3-build/plans/reexport-launders-layers.md",
    marker: "monthEmptyState.policy.ts:9",
  },
  {
    file: "docs/3-build/plans/reexport-launders-layers.md",
    marker: "| `kstDateOf` | `formatScheduleDate.utils` |",
  },
  {
    file: "docs/3-build/plans/auth-entry.md",
    marker: "`src/middleware.ts`",
  },
  {
    file: "docs/3-build/plans/attendance-excuse.md",
    marker: "/attendance-column.",
  },
  {
    file: "docs/3-build/plans/schedule-worker.md",
    marker: "/attendance-column.",
  },
  {
    file: "tests/lint/noFocusedTests.test.ts",
    marker: `회귀 — ${fileName("utils", ".test.ts")}는`,
  },
  {
    file: "docs/2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md",
    marker: "앞선 판은 「부르는 이름이 이긴다」로",
  },
  {
    file: "docs/3-build/plans/api-exports-only-transport.md",
    marker: "| `shared/utils/devDoor.ts` | `shared/lib/devDoor.lib.ts` |",
  },
  {
    file: "docs/3-build/plans/as-assertions-to-guards.md",
    marker: "`features/stats/utils/chartValues.utils.ts:36`과",
  },
  {
    file: "docs/3-build/plans/as-assertions-to-guards.md",
    marker: "**그리고 이 둘은 같은 이름의 파일이 두 슬라이스에 있다.**",
  },
  {
    file: "docs/3-build/plans/as-assertions-to-guards.md",
    marker: "| `features/pushSwitch/config/pushSwitch.config.ts:4` |",
  },
  {
    file: "docs/3-build/plans/audit-checks-into-catalog.md",
    marker:
      "`screens/notifications/hooks/pressNotification.ts` — 순수 판정이면",
  },
  {
    file: "docs/3-build/plans/duplicated-constants-and-copy.md",
    marker: "`DAY_MS` 일곱 자리 —",
  },
  {
    file: "docs/3-build/plans/duplicated-constants-and-copy.md",
    marker: "`screens/scheduleAdmin/model/adjustmentFailure.policy.ts:5`",
  },
  {
    file: "docs/3-build/plans/expo-scaffold.md",
    marker: "프레임워크를 안 타는 것은 그대로 간다",
  },
  {
    file: "docs/3-build/plans/fragments-own-their-data.md",
    marker: "는 `shared`만 당겨 지금도 옮길 수 있다",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "그것을 `useWorkMonthsQuery`와 달마다 맞추는",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "**접미사 패스가 reducer를 못 봤다.**",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "**재수출이 층을 우회하고 있었다.**",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "**`.policy.ts` 중에 통신을 실제로 부르는 것이 하나였고",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "`features/stats/hooks/useAttendanceMonths.ts`는 `services/",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "`features/auth/hooks/wireAutoRefresh.ts`는 `lib/",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "zustand store 둘의 자리가 갈려 있다",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "`canGoBack`·`canGoForward` —",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker:
      "`dayMinutes` — `features/payrollCompute/model/dayMinutes.policy.ts`",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "`attendanceSummaryLine` — `screens/",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "**재수출이 또 나왔다.**",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "| `shared/utils/theme.ts` |",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "| `shared/utils/fontLoading.ts` |",
  },
  {
    file: "docs/3-build/plans/fsd-read-write-layers.md",
    marker: "| `entities/clock/model/clock.store.ts` |",
  },
  {
    file: "docs/3-build/plans/loading-fragments-share-one-body.md",
    marker: "는 `api-exports-only-transport`가 같은 시기에 만진다",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "가장 또렷한 셋 —",
  },
  {
    file: "docs/3-build/plans/signout-removes-push-token.md",
    marker: "**projectId 읽기는 `shared/config`로 내린다.**",
  },
  {
    file: "docs/3-build/plans/spell-number-shared.md",
    marker: "**다만 한 자리는 대상을 잃는다.**",
  },
  {
    file: "docs/3-build/plans/spell-number-shared.md",
    marker: "**둘째 결함** —",
  },
  {
    file: "docs/3-build/plans/stats-admin.md",
    marker: "**포지션 아홉의 정본을",
  },
  {
    file: "docs/3-build/plans/stats-worker.md",
    marker: "**출근율 셈을 `entities`로 내린다.**",
  },
  {
    file: "docs/3-build/plans/stats-worker.md",
    marker: "에서 여기로 내려온다 — 인자가",
  },
  {
    file: "docs/3-build/plans/stats-worker.md",
    marker: "금액 꼴 `spellWon`이",
  },
  {
    file: "docs/3-build/plans/stats-worker.md",
    marker: "`NO_VALUE`(`–`)가",
  },
  {
    file: "docs/3-build/plans/supabase-client-entry.md",
    marker: "의 어긋남. 클라이언트를 받아 쓰는",
  },
  {
    file: "docs/proposals/codebase-refactor-triage.md",
    marker: "| 1 | `screens/payroll/model/period.policy.ts`의 `periodSpan`",
  },
  {
    file: "docs/proposals/codebase-refactor-triage.md",
    marker: "가장 또렷한 셋 —",
  },
  {
    file: "docs/proposals/post-refactor-audit.md",
    marker: "| 결론 1 | `features/pushSwitch/api/removePushToken.api.ts` |",
  },
  {
    file: "docs/proposals/post-refactor-audit.md",
    marker: "**같은 이름 다른 본문** —",
  },
  {
    file: "docs/backlog.md",
    marker: "| `screens-calc-placement` |",
  },
];

function* filesUnder(root: string, relative: string): Generator<string> {
  let entries;
  try {
    entries = readdirSync(path.join(root, relative), { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const child = `${relative}/${entry.name}`;

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }
      yield* filesUnder(root, child);
    } else if (entry.isFile()) {
      yield child;
    }
  }
}

function presentFilesIn(root: string): string[] {
  return SCANNED_ROOTS.flatMap((entry) => {
    let stats;
    try {
      stats = statSync(path.join(root, entry));
    } catch {
      return [];
    }

    return stats.isDirectory() ? [...filesUnder(root, entry)] : [entry];
  }).filter(
    (file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)),
  );
}

function isScannable(file: string): boolean {
  return !BINARY_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function isAllowed(file: string, line: string): boolean {
  return ALLOWED_LINES.some(
    (allowed) => allowed.file === file && line.includes(allowed.marker),
  );
}

function linesOf(root: string, file: string): string[] {
  return readFileSync(path.join(root, file), "utf8").split("\n");
}

function legacyPatternsIn(
  file: string,
  line: string,
  renamed: RenamedPatterns,
): string[] {
  const found = [
    ...LEGACY_PATHS.filter((pattern) => line.includes(pattern)),
    ...renamed.inEveryFile(line),
  ];

  if (!CODE_EXTENSIONS.has(path.extname(file))) {
    found.push(
      ...renamed.outsideCode(line),
      ...renamed.layerRelative(line),
      ...siblingPathsIn(line).filter((sibling) =>
        renamed.siblingTargets.has(sibling),
      ),
    );
  }

  return [...new Set(found)];
}

export function legacyPathViolations(
  root: string,
  renamedAway: string[],
): LegacyPathViolation[] {
  const presentFiles = presentFilesIn(root);
  const renamed = renamedPatternsFor(presentFiles, renamedAway);
  const violations: LegacyPathViolation[] = [];

  for (const file of presentFiles.filter(isScannable)) {
    for (const [index, line] of linesOf(root, file).entries()) {
      if (isAllowed(file, line)) {
        continue;
      }

      for (const pattern of legacyPatternsIn(file, line, renamed)) {
        violations.push({ file, pattern, line: index + 1 });
      }
    }
  }

  return violations;
}

function coversALegacyLine(
  root: string,
  renamed: RenamedPatterns,
  { file, marker }: AllowedLine,
) {
  let lines;
  try {
    lines = linesOf(root, file);
  } catch {
    return false;
  }

  return lines.some(
    (line) =>
      line.includes(marker) && legacyPatternsIn(file, line, renamed).length > 0,
  );
}

export function staleAllowedLines(
  root: string,
  renamedAway: string[],
): AllowedLine[] {
  const renamed = renamedPatternsFor(presentFilesIn(root), renamedAway);

  return ALLOWED_LINES.filter(
    (allowed) => !coversALegacyLine(root, renamed, allowed),
  );
}
