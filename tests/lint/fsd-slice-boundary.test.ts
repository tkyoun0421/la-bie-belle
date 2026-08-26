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

describe("규칙3 — 같은 층 다른 슬라이스 import", () => {
  it("entities/profile이 entities/schedule을 import하면 걸린다", async () => {
    const code = `import { Schedule } from "@/entities/schedule/model/schedule";\n\nexport const value = Schedule;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("같은 슬라이스 안 다른 세그먼트 import는 통과한다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport const value = Profile;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/dals/fixture.ts",
    );

    expect(result.errorCount).toBe(0);
  });
});
