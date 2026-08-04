import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../segment-imports.mjs";

const ruleTester = createRuleTester();

describe("segment-imports", () => {
  ruleTester.run("segment-imports", rule, {
    valid: [
      {
        name: "model이 순수 모듈을 import하는 것은 허용한다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import { z } from "zod";',
      },
      {
        name: "hooks는 react를 import할 수 있다",
        filename: "src/views/shift/hooks/useShiftList.ts",
        code: 'import { useState } from "react";',
      },
      {
        name: "ui는 react를 import할 수 있다",
        filename: "src/views/shift/ui/ShiftScreen.tsx",
        code: 'import { useState } from "react";',
      },
      {
        name: "제약이 없는 세그먼트는 판정하지 않는다",
        filename: "src/shared/lib/date.ts",
        code: 'import "server-only";',
      },
    ],
    invalid: [
      {
        name: "model의 react import를 막는다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import { useState } from "react";',
        errors: [{ messageId: "forbiddenImport" }],
      },
      {
        name: "model의 react-dom import를 막는다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import { createPortal } from "react-dom";',
        errors: [{ messageId: "forbiddenImport" }],
      },
      {
        name: "model의 server-only import를 막는다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import "server-only";',
        errors: [{ messageId: "forbiddenImport" }],
      },
      {
        name: "ui의 server-only import를 막는다",
        filename: "src/views/shift/ui/ShiftScreen.tsx",
        code: 'import "server-only";',
        errors: [{ messageId: "forbiddenImport" }],
      },
      {
        name: "ui가 api 세그먼트를 import하는 것을 막는다",
        filename: "src/views/shift/ui/ShiftScreen.tsx",
        code: 'import { fetchShifts } from "@/shared/api/shifts";',
        errors: [{ messageId: "forbiddenImport" }],
      },
      {
        name: "hooks의 server-only import를 막는다",
        filename: "src/views/shift/hooks/useShiftList.ts",
        code: 'import "server-only";',
        errors: [{ messageId: "forbiddenImport" }],
      },
    ],
  });
});
