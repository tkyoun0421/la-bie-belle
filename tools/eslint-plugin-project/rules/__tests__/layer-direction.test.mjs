import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../layer-direction.mjs";

const ruleTester = createRuleTester();

describe("layer-direction", () => {
  ruleTester.run("layer-direction", rule, {
    valid: [
      {
        name: "상위 계층이 하위 계층을 import한다",
        filename: "src/views/shift/ui/ShiftScreen.tsx",
        code: 'import { formatDate } from "@/shared/lib/date";',
      },
      {
        name: "features가 entities를 import한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'import { Shift } from "@/entities/shift/model/shift";',
      },
      {
        name: "같은 슬라이스 안의 상대 경로는 계층 판정 대상이 아니다",
        filename: "src/views/shift/ui/ShiftScreen.tsx",
        code: 'import { useShiftList } from "../hooks/useShiftList";',
      },
      {
        name: "외부 패키지는 판정하지 않는다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import { z } from "zod";',
      },
      {
        name: "src 밖의 파일은 판정하지 않는다",
        filename: "tools/eslint-plugin-project/index.mjs",
        code: 'import x from "@/shared/lib/date";',
      },
    ],
    invalid: [
      {
        name: "하위 계층이 상위 계층을 import하면 막는다",
        filename: "src/shared/lib/date.ts",
        code: 'import { ShiftScreen } from "@/views/shift/ui/ShiftScreen";',
        errors: [{ messageId: "wrongDirection" }],
      },
      {
        name: "entities가 features를 import하면 막는다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import { apply } from "@/features/apply/api/apply";',
        errors: [{ messageId: "wrongDirection" }],
      },
      {
        name: "같은 계층의 다른 슬라이스도 막는다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import { User } from "@/entities/user/model/user";',
        errors: [{ messageId: "sameLayer" }],
      },
      {
        name: "상대 경로로 계층을 거슬러 올라가도 막는다",
        filename: "src/shared/lib/date.ts",
        code: 'import { ShiftScreen } from "../../views/shift/ui/ShiftScreen";',
        errors: [{ messageId: "wrongDirection" }],
      },
    ],
  });
});
