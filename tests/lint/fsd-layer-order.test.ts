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

describe("규칙2 — FSD 역방향 import", () => {
  it("shared가 entities를 import하면 걸린다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport const value = Profile;\n`;

    const result = await lintFixture(code, "src/shared/lib/fixture.ts");

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("entities가 features를 import하면 걸린다", async () => {
    const code = `import { trackAttendance } from "@/features/attendance/model/attendance";\n\nexport const value = trackAttendance;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("features가 screens를 import하면 걸린다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\n\nexport const value = Home;\n`;

    const result = await lintFixture(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("screens가 app을 import하면 걸린다", async () => {
    const code = `import { Providers } from "@/app/providers";\n\nexport const value = Providers;\n`;

    const result = await lintFixture(code, "src/screens/home/ui/fixture.tsx");

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("app이 screens를 import하면 통과한다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\n\nexport const value = Home;\n`;

    const result = await lintFixture(code, "src/app/fixture.ts");

    expect(result.errorCount).toBe(0);
  });

  it("screens가 features를 import하면 통과한다", async () => {
    const code = `import { trackAttendance } from "@/features/attendance/model/attendance";\n\nexport const value = trackAttendance;\n`;

    const result = await lintFixture(code, "src/screens/home/ui/fixture2.tsx");

    expect(result.errorCount).toBe(0);
  });

  it("features가 entities를 import하면 통과한다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport const value = Profile;\n`;

    const result = await lintFixture(
      code,
      "src/features/attendance/model/fixture2.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("entities가 shared를 import하면 통과한다", async () => {
    const code = `import { cn } from "@/shared/lib/utils";\n\nexport const value = cn;\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture2.ts",
    );

    expect(result.errorCount).toBe(0);
  });
});
