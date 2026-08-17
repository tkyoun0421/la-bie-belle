import nextPlugin from "@next/eslint-plugin-next";
import importX from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import project from "./tools/eslint-plugin-project/index.mjs";

const ENV_MODULES = ["src/shared/config/env.server.ts", "src/shared/config/env.client.ts"];

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      ".probe/**",
    ],
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { project, "import-x": importX },
    rules: {
      "project/no-comments": "error",
      "import-x/no-cycle": "error",
      "no-console": "error",
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: `process.env는 ${ENV_MODULES.join(", ")}에서만 읽습니다 (DEV-SEC-02). 검증된 값을 import해서 쓰세요.`,
        },
      ],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { project },
    rules: {
      "project/layer-direction": "error",
      "project/segment-name": "error",
      "project/segment-imports": "error",
      "project/no-runtime-export": "error",
      "project/require-server-only": "error",
      "project/file-naming": "error",
      "project/error-code-literal": "error",
      "project/import-alias": "error",
      "project/spacing-scale": "error",
      "project/test-placement": "error",
      "project/design-token-colors": "error",
      "project/motion-tokens": "error",
      "project/no-logic-in-ui": "error",
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  {
    files: ENV_MODULES,
    rules: { "no-restricted-properties": "off" },
  },

  {
    files: [
      "src/features/assignment/ui/AssignmentCandidateSheet.tsx",
      "src/features/ceremony/ui/CheckInRuleEditor.tsx",
      "src/features/ceremony/ui/PlannedTimesEditor.tsx",
      "src/features/confirmation/ui/ConfirmScheduleDialog.tsx",
      "src/features/position/ui/PositionEditSheet.tsx",
      "src/features/position/ui/PositionList.tsx",
      "src/features/push/ui/PushPrimingSheet.tsx",
      "src/features/recruitment/ui/RecruitmentManageSheet.tsx",
      "src/features/recruitment/ui/RecruitmentSubmitPanel.tsx",
      "src/features/requirement/ui/MissingPositionsBanner.tsx",
      "src/features/signup/ui/SignupForm.tsx",
      "src/features/worker-management/ui/WorkerInfoForm.tsx",
      "src/shared/ui/calendar.tsx",
      "src/shared/ui/select-field.tsx",
      "src/views/admin-recruitment/ui/RecruitmentOpenView.tsx",
      "src/views/admin-schedule/ui/AdminSchedulePrepView.tsx",
      "src/views/admin/ui/ApprovalListView.tsx",
      "src/views/admin/ui/WorkerListView.tsx",
      "src/views/catalog/ui/CatalogView.tsx",
      "src/views/notifications/ui/NotificationsView.tsx",
      "src/views/pay/ui/PayView.tsx",
      "src/views/preview/ui/PreviewView.tsx",
      "src/views/schedule-detail/ui/ScheduleDetailView.tsx",
      "src/views/schedule/ui/DeadlineBatchList.tsx",
      "src/views/schedule/ui/ScheduleView.tsx",
      "src/widgets/pull-to-refresh/ui/PullToRefresh.tsx",
    ],
    rules: { "project/no-logic-in-ui": "off" },
  },
];
