import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../file-naming.mjs";

const ruleTester = createRuleTester();
const CODE = "export const a = 1;";

describe("file-naming", () => {
  ruleTester.run("file-naming", rule, {
    valid: [
      {
        name: "ui 세그먼트의 컴포넌트는 PascalCase다",
        filename: "src/views/shift-request/ui/ShiftCard.tsx",
        code: CODE,
      },
      {
        name: "hooks 세그먼트의 훅은 useCamelCase다",
        filename: "src/views/shift-request/hooks/useShiftList.ts",
        code: CODE,
      },
      {
        name: "일반 파일은 kebab-case다",
        filename: "src/shared/lib/format-date.ts",
        code: CODE,
      },
      {
        name: "한 단어 파일도 kebab-case로 본다",
        filename: "src/shared/lib/date.ts",
        code: CODE,
      },
      {
        name: "폴더가 kebab-case면 통과한다",
        filename: "src/entities/shift-assignment/model/rules.ts",
        code: CODE,
      },
      {
        name: "Next.js 예약 파일명은 예외다",
        filename: "src/app/dashboard/page.tsx",
        code: CODE,
      },
      {
        name: "동적 라우트 폴더도 예외다",
        filename: "src/app/shift/[id]/page.tsx",
        code: CODE,
      },
      {
        name: "tdd-guard가 안내하는 __tests__ 폴더는 예외다",
        filename: "src/entities/shift-assignment/model/__tests__/rules.test.ts",
        code: CODE,
      },
      {
        name: "__tests__ 안에서는 파일 이름 규칙도 묻지 않는다",
        filename: "src/entities/shift-assignment/model/__tests__/ShiftCard.test.tsx",
        code: CODE,
      },
      {
        name: "shadcn 관리 구역은 예외다",
        filename: "src/shared/ui/button.tsx",
        code: CODE,
      },
      {
        name: "테스트 파일은 대상 파일 규칙을 따른다",
        filename: "src/shared/lib/format-date.test.ts",
        code: CODE,
      },
      {
        name: "src 밖은 판정하지 않는다",
        filename: "tools/eslint-plugin-project/index.mjs",
        code: CODE,
      },
    ],
    invalid: [
      {
        name: "예외는 __tests__ 하나이고 다른 밑줄 폴더는 계속 막는다",
        filename: "src/entities/shift-assignment/model/__mocks__/rules.ts",
        code: CODE,
        errors: [{ messageId: "folder" }],
      },
      {
        name: "__tests__와 이름이 비슷한 폴더는 예외가 아니다",
        filename: "src/entities/shift-assignment/model/__tests__helper/rules.ts",
        code: CODE,
        errors: [{ messageId: "folder" }],
      },
      {
        name: "ui 세그먼트의 kebab-case 컴포넌트를 막는다",
        filename: "src/views/shift-request/ui/shift-card.tsx",
        code: CODE,
        errors: [{ messageId: "componentFile" }],
      },
      {
        name: "hooks 세그먼트의 kebab-case 훅을 막는다",
        filename: "src/views/shift-request/hooks/use-shift-list.ts",
        code: CODE,
        errors: [{ messageId: "hookFile" }],
      },
      {
        name: "hooks 세그먼트에서 use로 시작하지 않는 파일을 막는다",
        filename: "src/views/shift-request/hooks/shiftList.ts",
        code: CODE,
        errors: [{ messageId: "hookFile" }],
      },
      {
        name: "일반 파일의 camelCase를 막는다",
        filename: "src/shared/lib/formatDate.ts",
        code: CODE,
        errors: [{ messageId: "generalFile" }],
      },
      {
        name: "일반 파일의 PascalCase를 막는다",
        filename: "src/shared/lib/FormatDate.ts",
        code: CODE,
        errors: [{ messageId: "generalFile" }],
      },
      {
        name: "폴더의 camelCase를 막는다",
        filename: "src/entities/shiftAssignment/model/rules.ts",
        code: CODE,
        errors: [{ messageId: "folder" }],
      },
      {
        name: "폴더의 PascalCase를 막는다",
        filename: "src/entities/ShiftAssignment/model/rules.ts",
        code: CODE,
        errors: [{ messageId: "folder" }],
      },
    ],
  });
});
