import { describe, expect, it } from "vitest";
import { violationsOf } from "@tests/lint/rule-check";

const NO_RESTRICTED_IMPORTS = "no-restricted-imports";

describe("규칙1 — 상대 경로 import 금지", () => {
  it("@tests alias로 tests/ 를 가리키면 통과한다", async () => {
    const code = `import { createGuestClient } from "@tests/integration/supabase";\n\nexport const client = createGuestClient;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/dals/__tests__/profile.integration.test.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("깊은 상대 경로로 tests/ 를 가리키면 걸린다", async () => {
    const code = `import { createGuestClient } from "../../../../../tests/integration/supabase";\n\nexport const client = createGuestClient;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/dals/__tests__/profile.integration.test.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("같은 폴더를 가리키는 ./ 상대 import가 걸린다", async () => {
    const code = `import { x } from "./x";\n\nexport const value = x;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/profile.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("상위 폴더를 가리키는 ../ 상대 import가 걸린다", async () => {
    const code = `import { y } from "../y";\n\nexport const value = y;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/profile.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("layout.tsx의 ./providers 상대 import가 걸린다", async () => {
    const code = `import { Providers } from "./providers";\nimport "./globals.css";\n\nexport const value = Providers;\n`;

    const violations = await violationsOf(code, "src/app/layout.tsx");
    const providersLine = violations.filter(
      (violation) =>
        violation.ruleId === NO_RESTRICTED_IMPORTS && violation.line === 1,
    );

    expect(providersLine.length).toBeGreaterThan(0);
  });

  it("layout.tsx의 ./globals.css 상대 import가 걸린다", async () => {
    const code = `import { Providers } from "./providers";\nimport "./globals.css";\n\nexport const value = Providers;\n`;

    const violations = await violationsOf(code, "src/app/layout.tsx");
    const globalsCssLine = violations.filter(
      (violation) =>
        violation.ruleId === NO_RESTRICTED_IMPORTS && violation.line === 2,
    );

    expect(globalsCssLine.length).toBeGreaterThan(0);
  });
});
