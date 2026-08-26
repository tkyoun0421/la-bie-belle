import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lintFixture(code: string, filePath: string, fix = false) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs", fix });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), filePath),
  });
  return result;
}

function importSources(code: string) {
  return [...code.matchAll(/from\s+["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

describe("규칙11 — import 순서", () => {
  it("app 레이어를 shared보다 먼저 import하면 걸린다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\nimport { cn } from "@/shared/lib/utils";\n\nexport const value = { Home, cn };\n`;

    const result = await lintFixture(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("shared → entities → features → screens → app 순서는 위반 0건이다", async () => {
    const code = `import { cn } from "@/shared/lib/utils";\nimport { Profile } from "@/entities/profile/model/profile";\nimport { trackAttendance } from "@/features/attendance/model/attendance";\nimport { Home } from "@/screens/home/ui/home";\n\nexport const value = { cn, Profile, trackAttendance, Home };\n`;

    const result = await lintFixture(code, "src/app/fixture.ts");

    expect(result.errorCount).toBe(0);
  });

  it("외부 패키지가 먼저 오고 FSD 그룹이 순서대로면 위반 0건이다", async () => {
    const code = `import { describe } from "vitest";\nimport { cn } from "@/shared/lib/utils";\nimport { Profile } from "@/entities/profile/model/profile";\n\nexport const value = { describe, cn, Profile };\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/__tests__/fixture.test.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("--fix를 적용하면 import 순서가 바로잡힌다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\nimport { cn } from "@/shared/lib/utils";\n\nexport const value = { Home, cn };\n`;

    const result = await lintFixture(
      code,
      "src/features/attendance/model/fixture.ts",
      true,
    );
    const fixedCode = result.output ?? code;

    expect(importSources(fixedCode)).toEqual([
      "@/shared/lib/utils",
      "@/screens/home/ui/home",
    ]);
  });

  it("CSS side-effect import가 섞여도 크래시나 오탐 없이 판정된다", async () => {
    const code = `import "@/app/globals.css";\nimport { cn } from "@/shared/lib/utils";\nimport { Home } from "@/screens/home/ui/home";\n\nexport const value = { cn, Home };\n`;

    const result = await lintFixture(code, "src/app/fixture.ts");

    expect(result.errorCount).toBe(0);
  });

  it("회귀 — alias로 고친 layout.tsx는 위반 0건이다", async () => {
    const code = `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = { title: "La Bie Belle" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
`;

    const result = await lintFixture(code, "src/app/layout.tsx");

    expect(result.errorCount).toBe(0);
  });
});
