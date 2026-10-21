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

const RENAMED_FILE_STEMS: Record<string, string[]> = {
  ".mts": [
    "check-moved-lines",
    "check-sources-impact",
    "e2e-seed-server",
    "font-subset",
    "generate-database-types",
    "generate-globals-css",
    "generate-route-types",
    "inline-sian-font",
    "sync-edge-shared",
    "tokens-md",
    "tossface-fetch",
  ],
  ".mjs": ["module-alias-hooks"],
  ".js": ["seed-session"],
  ".ts": [
    "attendance-constants",
    "backlog-ids",
    "contrast-check",
    "database-types",
    "design-map",
    "doc-links",
    "doc-map",
    "error-codes",
    "file-naming",
    "font-subset",
    "legacy-doc-paths",
    "route-types",
    "rule-check",
    "sian-html",
    "slug-chain",
    "sources-exist",
    "sources-impact",
    "spec-docs",
    "spec-grid",
    "table-rls",
    "tossface-fetch",
  ],
  ".test.ts": [
    "attendance-constants",
    "backlog-ids",
    "contrast-check",
    "dark-media-query-compiles",
    "database-types",
    "design-map",
    "design-token-values",
    "doc-links",
    "doc-map",
    "error-codes",
    "file-naming",
    "font-asset-files",
    "font-subset",
    "format-check",
    "fsd-layer-order",
    "fsd-slice-boundary",
    "generate-globals-css",
    "import-order",
    "legacy-doc-paths",
    "native-compile-values",
    "no-console",
    "no-focused-tests",
    "pre-commit",
    "relative-import",
    "route-types",
    "rule-catalogue",
    "sian-html",
    "slug-chain",
    "sources-exist",
    "sources-impact",
    "spec-docs",
    "spec-grid",
    "table-rls",
    "tailwind-default-palette",
    "tossface-fetch",
    "tsx-dumb-ui",
    "unused-imports",
  ],
};

const RENAMED_SOURCE_PATHS = [
  "src/entities/attendance/hooks/useQrCodeQuery.ts",
  "src/entities/attendance/model/__tests__/attendance-summary.test.ts",
  "src/entities/attendance/model/attendance-status.ts",
  "src/entities/attendance/model/attendance-summary.ts",
  "src/entities/notification/model/__tests__/destination.test.ts",
  "src/entities/notification/model/__tests__/title.test.ts",
  "src/entities/notification/model/__tests__/when.test.ts",
  "src/entities/qr/hooks/__tests__/useQrCodeQuery.test.ts",
  "src/entities/qr/hooks/useQrCodeQuery.ts",
  "src/entities/rehearsal/model/__tests__/rehearsal-hours.test.ts",
  "src/entities/rehearsal/model/rehearsal-hours.ts",
  "src/features/attendance/model/attendance-summary.ts",
  "src/features/notification/model/__tests__/push-message.test.ts",
  "src/features/notification/model/push-message.ts",
  "src/features/notification/model/push-permission.ts",
  "src/features/notification/model/push-result.ts",
  "src/features/notification/model/reach-state.ts",
  "src/features/notification/model/useMarkNotificationsRead.ts",
  "src/features/notification/model/useNotificationSwitch.ts",
  "src/features/notification/model/useNotifications.ts",
  "src/features/notification/model/useSavePushToken.ts",
  "src/features/notification/model/useUnreadCount.ts",
  "src/features/payroll/model/__tests__/holiday-api-response.test.ts",
  "src/features/payroll/model/__tests__/payroll-days.test.ts",
  "src/features/payroll/model/day-amount.ts",
  "src/features/payroll/model/day-minutes.ts",
  "src/features/payroll/model/holiday-api-response.ts",
  "src/features/payroll/model/payroll-days.ts",
  "src/features/payroll/model/query-keys.ts",
  "src/features/payroll/model/usePayrollMonths.ts",
  "src/features/payroll/model/useSetAdjustment.ts",
  "src/features/payroll/model/useSetWage.ts",
  "src/features/payroll/model/useWageRates.ts",
  "src/features/rehearsal/model/__tests__/can-add-on.test.ts",
  "src/features/rehearsal/model/kind-for-date.ts",
  "src/features/rehearsal/model/query-keys.ts",
  "src/features/rehearsal/model/useMyRehearsals.ts",
  "src/features/rehearsal/model/useRehearsalMonths.ts",
  "src/features/schedule/model/query-keys.ts",
  "src/features/schedule/model/useMonthSchedule.ts",
  "src/features/schedule/model/useMyAvailability.ts",
  "src/features/schedule/model/useScheduleMonths.ts",
  "src/features/stats/model/__tests__/my-totals.test.ts",
  "src/features/stats/model/__tests__/person-days.test.ts",
  "src/features/stats/model/__tests__/trend.test.ts",
  "src/features/stats/model/__tests__/work-totals.test.ts",
  "src/features/stats/model/attendance-inputs.ts",
  "src/features/stats/model/my-totals.ts",
  "src/features/stats/model/person-days.ts",
  "src/features/stats/model/work-totals.ts",
  "src/screens/admin-home/model/approvals-line.ts",
  "src/screens/admin-home/model/tile-month.ts",
  "src/screens/admin-home/model/today-status.ts",
  "src/screens/admin-home/ui/AdminHomeScreen.tsx",
  "src/screens/admin-stats/model/attendance-rows.ts",
  "src/screens/admin-stats/model/chart-values.ts",
  "src/screens/admin-stats/ui/AdminStatsScreen.tsx",
  "src/screens/admin-stats/ui/WorkDaysSheet.tsx",
  "src/screens/applications/model/applications-grouping.ts",
  "src/screens/approvals/model/approval-detail.ts",
  "src/screens/approvals/model/approvals-list.ts",
  "src/screens/approvals/model/reject-reason.ts",
  "src/screens/members/ui/MemberDialog.tsx",
  "src/screens/notifications/hooks/pressNotification.ts",
  "src/screens/notifications/model/notification-rows.ts",
  "src/screens/notifications/model/press-notification.ts",
  "src/screens/notifications/model/pressNotification.policy.ts",
  "src/screens/payroll/model/__tests__/history-rows.test.ts",
  "src/screens/payroll/model/__tests__/period.policy.test.ts",
  "src/screens/payroll/model/__tests__/period.test.ts",
  "src/screens/payroll/model/__tests__/summary.test.ts",
  "src/screens/payroll/model/__tests__/year-rows.test.ts",
  "src/screens/payroll/model/boundary.policy.ts",
  "src/screens/payroll/model/history-rows.ts",
  "src/screens/payroll/model/period.policy.ts",
  "src/screens/payroll/model/year-rows.ts",
  "src/screens/payroll/utils/summary.utils.ts",
  "src/screens/pending/model/__tests__/notification-prompt.test.ts",
  "src/screens/pending/model/notification-prompt.ts",
  "src/screens/profile/model/has-rehearsal-grant.ts",
  "src/screens/qr/utils/qrSvg.utils.ts",
  "src/screens/rehearsal/model/rehearsal-day-cell.ts",
  "src/screens/schedule-admin/model/__tests__/absence-minutes.test.ts",
  "src/screens/schedule-admin/model/__tests__/adjust-choice-state.test.ts",
  "src/screens/schedule-admin/model/__tests__/adjust-sheet-rows.test.ts",
  "src/screens/schedule-admin/model/__tests__/adjustment-count.test.ts",
  "src/screens/schedule-admin/model/__tests__/holiday-switch.test.ts",
  "src/screens/schedule-admin/model/absence-minutes.ts",
  "src/screens/schedule-admin/model/adjust-choice-state.ts",
  "src/screens/schedule-admin/model/adjust-sheet-rows.ts",
  "src/screens/schedule-admin/model/adjustment-count.ts",
  "src/screens/schedule-admin/model/adjustment-failure.ts",
  "src/screens/schedule-admin/model/admin-calendar-day-state.ts",
  "src/screens/schedule-admin/model/format-schedule-date.ts",
  "src/screens/schedule-admin/model/holiday-switch.ts",
  "src/screens/schedule-admin/model/person-picker-rows.ts",
  "src/screens/schedule-admin/model/position-rows.ts",
  "src/screens/schedule-admin/ui/AdjustSheet.tsx",
  "src/screens/schedule-admin/ui/DayDetail.tsx",
  "src/screens/schedule-admin/ui/PersonPickerSheet.tsx",
  "src/screens/schedule-admin/ui/PositionRow.tsx",
  "src/screens/schedule-admin/ui/ScheduleAdminScreen.tsx",
  "src/screens/schedule-worker/model/agenda-row.ts",
  "src/screens/schedule-worker/model/calendar-day-state.ts",
  "src/screens/schedule-worker/model/day-sheet.ts",
  "src/screens/schedule-worker/model/month-state.ts",
  "src/screens/schedule-worker/model/request-sheet.ts",
  "src/screens/schedule-worker/model/submission-selection.ts",
  "src/screens/schedule-worker/ui/DayRoster.tsx",
  "src/screens/schedule-worker/ui/RequestSheet.tsx",
  "src/screens/schedule-worker/ui/ScheduleWorkerScreen.tsx",
  "src/screens/scheduleAdmin/model/monthEmptyState.policy.ts",
  "src/screens/scheduleAdmin/utils/deadlineLine.utils.ts",
  "src/screens/scheduleWorker/model/monthState.policy.ts",
  "src/screens/stats/model/attendance-days.ts",
  "src/screens/stats/model/attendance-shares.ts",
  "src/screens/stats/model/attendance-summary-line.ts",
  "src/screens/stats/model/attendance-tally.ts",
  "src/screens/stats/model/chart-values.ts",
  "src/screens/stats/model/money-label.ts",
  "src/screens/stats/model/payroll-summary.ts",
  "src/screens/wages/model/__tests__/follower-count.test.ts",
  "src/screens/wages/model/__tests__/wage-amount.test.ts",
  "src/screens/wages/model/__tests__/wage-rows.test.ts",
  "src/screens/wages/model/can-reset-to-default.ts",
  "src/screens/wages/model/follower-count.ts",
  "src/screens/wages/model/wage-amount.ts",
  "src/screens/wages/model/wage-history.ts",
  "src/screens/wages/model/wage-rows.ts",
  "src/screens/wages/ui/DefaultWageSheet.tsx",
  "src/screens/wages/ui/MemberWageSheet.tsx",
  "src/screens/wages/ui/ResetWageDialog.tsx",
  "src/shared/api/errorCodes.ts",
  "src/shared/lib/__tests__/month-boundary.test.ts",
  "src/shared/lib/__tests__/resolve-auth-destination.test.ts",
  "src/shared/lib/__tests__/spell-number.test.ts",
  "src/shared/lib/fontLoading.ts",
  "src/shared/lib/handle-auth-callback.ts",
  "src/shared/lib/kst-date.ts",
  "src/shared/lib/mini-calendar.ts",
  "src/shared/lib/month-boundary.ts",
  "src/shared/lib/month-picker.ts",
  "src/shared/lib/no-value.ts",
  "src/shared/lib/read-supabase-env.ts",
  "src/shared/lib/resolve-auth-destination.ts",
  "src/shared/lib/server-clock.ts",
  "src/shared/lib/spell-number.ts",
];

type LegacyPattern = {
  pattern: string;
  foundIn: (line: string) => boolean;
};

function fileName(stem: string, extension: string): string {
  return `${stem}${extension}`;
}

const OLD_SEED_SESSION = fileName("seed-session", ".js");

function escapedForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function standaloneFileName(name: string): RegExp {
  return new RegExp(`(?<![\\w.-])${escapedForRegExp(name)}(?![\\w-])`);
}

function standalonePattern(pattern: string): LegacyPattern {
  const regExp = standaloneFileName(pattern);

  return { pattern, foundIn: (line: string) => regExp.test(line) };
}

const LEGACY_PATTERNS: LegacyPattern[] = [
  ...LEGACY_PATHS.map((pattern) => ({
    pattern,
    foundIn: (line: string) => line.includes(pattern),
  })),
  ...Object.entries(RENAMED_FILE_STEMS).flatMap(([extension, stems]) =>
    stems.map((stem) => standalonePattern(fileName(stem, extension))),
  ),
];

const RENAMED_SOURCE_PATTERNS: LegacyPattern[] =
  RENAMED_SOURCE_PATHS.map(standalonePattern);

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".mjs", ".js"]);

function patternsFor(file: string): LegacyPattern[] {
  return CODE_EXTENSIONS.has(path.extname(file))
    ? LEGACY_PATTERNS
    : [...LEGACY_PATTERNS, ...RENAMED_SOURCE_PATTERNS];
}

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

function scannedFiles(root: string): string[] {
  return SCANNED_ROOTS.flatMap((entry) => {
    let stats;
    try {
      stats = statSync(path.join(root, entry));
    } catch {
      return [];
    }

    return stats.isDirectory() ? [...filesUnder(root, entry)] : [entry];
  });
}

function isScannable(file: string): boolean {
  if (EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix))) {
    return false;
  }

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

function legacyPatternsIn(file: string, line: string): string[] {
  return patternsFor(file)
    .filter(({ foundIn }) => foundIn(line))
    .map(({ pattern }) => pattern);
}

export function legacyPathViolations(root: string): LegacyPathViolation[] {
  const violations: LegacyPathViolation[] = [];

  for (const file of scannedFiles(root).filter(isScannable)) {
    for (const [index, line] of linesOf(root, file).entries()) {
      if (isAllowed(file, line)) {
        continue;
      }

      for (const pattern of legacyPatternsIn(file, line)) {
        violations.push({ file, pattern, line: index + 1 });
      }
    }
  }

  return violations;
}

function coversALegacyLine(root: string, { file, marker }: AllowedLine) {
  let lines;
  try {
    lines = linesOf(root, file);
  } catch {
    return false;
  }

  return lines.some(
    (line) => line.includes(marker) && legacyPatternsIn(file, line).length > 0,
  );
}

export function staleAllowedLines(root: string): AllowedLine[] {
  return ALLOWED_LINES.filter((allowed) => !coversALegacyLine(root, allowed));
}
