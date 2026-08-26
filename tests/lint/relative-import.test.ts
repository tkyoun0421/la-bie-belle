import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lintFixture(code: string, filePath: string) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), filePath),
  });
  return result;
}

describe("규칙1 — 상대 경로 import 금지", () => {
  it("@tests alias로 tests/ 를 가리키면 통과한다", async () => {
    const code = `import { createGuestClient } from "@tests/integration/supabase";\n\nexport const client = createGuestClient;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/dals/__tests__/profile.integration.test.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("깊은 상대 경로로 tests/ 를 가리키면 걸린다", async () => {
    const code = `import { createGuestClient } from "../../../../../tests/integration/supabase";\n\nexport const client = createGuestClient;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/dals/__tests__/profile.integration.test.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("같은 폴더를 가리키는 ./ 상대 import가 걸린다", async () => {
    const code = `import { x } from "./x";\n\nexport const value = x;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/profile.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("상위 폴더를 가리키는 ../ 상대 import가 걸린다", async () => {
    const code = `import { y } from "../y";\n\nexport const value = y;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/profile.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("layout.tsx의 ./providers 상대 import가 걸린다", async () => {
    const code = `import { Providers } from "./providers";\nimport "./globals.css";\n\nexport const value = Providers;\n`;

    const result = await lintFixture(code, "src/app/layout.tsx");
    const providersLineErrors = result.messages.filter(
      (message) => message.severity === 2 && message.line === 1,
    );

    expect(providersLineErrors.length).toBeGreaterThan(0);
  });

  it("layout.tsx의 ./globals.css 상대 import가 걸린다", async () => {
    const code = `import { Providers } from "./providers";\nimport "./globals.css";\n\nexport const value = Providers;\n`;

    const result = await lintFixture(code, "src/app/layout.tsx");
    const globalsCssLineErrors = result.messages.filter(
      (message) => message.severity === 2 && message.line === 2,
    );

    expect(globalsCssLineErrors.length).toBeGreaterThan(0);
  });
});
