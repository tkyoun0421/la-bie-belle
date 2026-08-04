import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../require-server-only.mjs";

const ruleTester = createRuleTester();

describe("require-server-only", () => {
  ruleTester.run("require-server-only", rule, {
    valid: [
      {
        name: "api 세그먼트가 첫 import로 server-only를 선언한다",
        filename: "src/shared/api/shifts.ts",
        code: 'import "server-only";\n\nimport { z } from "zod";\n\nexport const a = 1;',
      },
      {
        name: "server-only 선언만 있어도 된다",
        filename: "src/features/apply/api/apply.ts",
        code: 'import "server-only";\n\nexport const a = 1;',
      },
      {
        name: "요구하지 않는 세그먼트는 판정하지 않는다",
        filename: "src/entities/shift/model/shift.ts",
        code: 'import { z } from "zod";\n\nexport const a = 1;',
      },
      {
        name: "면제 경로는 판정하지 않는다",
        filename: "src/shared/api/generated/database.types.ts",
        code: "export type Db = { id: string };",
      },
    ],
    invalid: [
      {
        name: "api 세그먼트에 server-only 선언이 없으면 막는다",
        filename: "src/shared/api/shifts.ts",
        code: 'import { z } from "zod";\n\nexport const a = 1;',
        errors: [{ messageId: "missingServerOnly" }],
      },
      {
        name: "server-only가 첫 import가 아니면 막는다",
        filename: "src/shared/api/shifts.ts",
        code: 'import { z } from "zod";\nimport "server-only";\n\nexport const a = 1;',
        errors: [{ messageId: "notFirstImport" }],
      },
      {
        name: "import이 하나도 없어도 막는다",
        filename: "src/shared/api/shifts.ts",
        code: "export const a = 1;",
        errors: [{ messageId: "missingServerOnly" }],
      },
    ],
  });
});
