export type EnforcedRule = {
  no: number;
  name: string;
  mechanism: "eslint" | "house" | "prettier" | "hook" | "pre-commit";
  ruleId: string | null;
  enforcedBy: string | null;
  test: string | null;
};

export const DOCUMENTED_LINT_RULE_COUNT = 21;

export const ENFORCED_RULE_COUNT = 21;

export const RULE_NUMBERS_NEVER_ASSIGNED = [6, 7, 8];

export const RULES: EnforcedRule[] = [
  {
    no: 1,
    name: "상대 경로 import 금지",
    mechanism: "eslint",
    ruleId: "no-restricted-imports",
    enforcedBy: null,
    test: "tests/lint/relativeImport.test.ts",
  },
  {
    no: 2,
    name: "FSD 역방향 import",
    mechanism: "eslint",
    ruleId: "no-restricted-imports",
    enforcedBy: null,
    test: "tests/lint/fsdLayerOrder.test.ts",
  },
  {
    no: 3,
    name: "같은 층 다른 슬라이스 import",
    mechanism: "house",
    ruleId: "house/no-cross-slice-import",
    enforcedBy: null,
    test: "tests/lint/fsdSliceBoundary.test.ts",
  },
  {
    no: 4,
    name: "하드코딩한 색과 크기",
    mechanism: "house",
    ruleId: "house/no-arbitrary-class-values",
    enforcedBy: null,
    test: "tests/lint/designTokenValues.test.ts",
  },
  {
    no: 4,
    name: "하드코딩한 색과 크기",
    mechanism: "house",
    ruleId: "house/no-color-literals",
    enforcedBy: null,
    test: "tests/lint/designTokenValues.test.ts",
  },
  {
    no: 5,
    name: "Tailwind 기본 팔레트 유틸리티",
    mechanism: "house",
    ruleId: "house/no-default-palette-class",
    enforcedBy: null,
    test: "tests/lint/tailwindDefaultPalette.test.ts",
  },
  {
    no: 9,
    name: ".tsx는 더미 UI",
    mechanism: "house",
    ruleId: "house/dumb-ui",
    enforcedBy: null,
    test: "tests/lint/tsxDumbUi.test.ts",
  },
  {
    no: 10,
    name: "집중 실행 표시",
    mechanism: "eslint",
    ruleId: "no-restricted-syntax",
    enforcedBy: null,
    test: "tests/lint/noFocusedTests.test.ts",
  },
  {
    no: 11,
    name: "import 순서",
    mechanism: "eslint",
    ruleId: "import/order",
    enforcedBy: null,
    test: "tests/lint/importOrder.test.ts",
  },
  {
    no: 12,
    name: "Tailwind 클래스 순서",
    mechanism: "prettier",
    ruleId: null,
    enforcedBy: "prettier.config.mjs",
    test: "tests/lint/formatCheck.test.ts",
  },
  {
    no: 13,
    name: "console",
    mechanism: "eslint",
    ruleId: "no-console",
    enforcedBy: null,
    test: "tests/lint/noConsole.test.ts",
  },
  {
    no: 14,
    name: "미사용 import와 import type",
    mechanism: "eslint",
    ruleId: "unused-imports/no-unused-imports",
    enforcedBy: null,
    test: "tests/lint/unusedImports.test.ts",
  },
  {
    no: 14,
    name: "미사용 import와 import type",
    mechanism: "eslint",
    ruleId: "@typescript-eslint/consistent-type-imports",
    enforcedBy: null,
    test: "tests/lint/unusedImports.test.ts",
  },
  {
    no: 15,
    name: "내보내는 함수마다 그것을 부르는 짝 테스트가 먼저 있어야 한다",
    mechanism: "hook",
    ruleId: null,
    enforcedBy: ".claude/hooks/tdd-guard-unit.py",
    test: ".claude/hooks/__tests__/tdd-guard.test.ts",
  },
  {
    no: 16,
    name: "화면과 라우트를 쓰기 전에 e2e 플로우가 있어야 한다",
    mechanism: "hook",
    ruleId: null,
    enforcedBy: ".claude/hooks/tdd-guard-e2e.py",
    test: ".claude/hooks/__tests__/tdd-guard.test.ts",
  },
  {
    no: 17,
    name: "시크릿과 .env는 커밋할 수 없다",
    mechanism: "pre-commit",
    ruleId: null,
    enforcedBy: ".githooks/pre-commit",
    test: "tests/lint/preCommit.test.ts",
  },
  {
    no: 18,
    name: "승인된 spec 없이 feat 브랜치에서 src/를 고칠 수 없다",
    mechanism: "hook",
    ruleId: null,
    enforcedBy: ".claude/hooks/spec-gate.py",
    test: ".claude/hooks/__tests__/spec-gate.test.ts",
  },
  {
    no: 19,
    name: "화면 파일의 시각 유틸리티",
    mechanism: "house",
    ruleId: "house/no-visual-utility-class",
    enforcedBy: null,
    test: "eslint-rules/__tests__/noVisualUtilityClass.test.ts",
  },
  {
    no: 20,
    name: "Edge Function의 마운트 밖 import",
    mechanism: "house",
    ruleId: "house/no-edge-function-src-import",
    enforcedBy: null,
    test: "eslint-rules/__tests__/noEdgeFunctionSrcImport.test.ts",
  },
  {
    no: 21,
    name: "Deno로 복사되는 폴더의 node: import",
    mechanism: "house",
    ruleId: "house/no-node-import-in-edge-shared",
    enforcedBy: null,
    test: "eslint-rules/__tests__/noNodeImportInEdgeShared.test.ts",
  },
];
