import { describe, expect, it } from "vitest";
import { errorsOf, fixedCode, violationsOf } from "@tests/lint/rule-check";

const IMPORT_ORDER = "import/order";

function importSources(code: string) {
  return [...code.matchAll(/from\s+["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

describe("규칙11 — import 순서", () => {
  it("app 레이어를 shared보다 먼저 import하면 import/order가 걸린다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\nimport { cn } from "@/shared/lib/utils";\n\nexport const value = { Home, cn };\n`;

    const violations = await violationsOf(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      IMPORT_ORDER,
    );
  });

  it("shared → entities → features → screens → app 순서는 import/order가 안 걸린다", async () => {
    const code = `import { cn } from "@/shared/lib/utils";\nimport { Profile } from "@/entities/profile/model/profile";\nimport { trackAttendance } from "@/features/attendance/model/attendance";\nimport { Home } from "@/screens/home/ui/home";\n\nexport const value = { cn, Profile, trackAttendance, Home };\n`;

    const violations = await violationsOf(code, "src/app/fixture.ts");

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      IMPORT_ORDER,
    );
  });

  it("외부 패키지가 먼저 오고 FSD 그룹이 순서대로면 import/order가 안 걸린다", async () => {
    const code = `import { describe } from "vitest";\nimport { cn } from "@/shared/lib/utils";\nimport { Profile } from "@/entities/profile/model/profile";\n\nexport const value = { describe, cn, Profile };\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/__tests__/fixture.test.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      IMPORT_ORDER,
    );
  });

  it("--fix를 적용하면 import 순서가 바로잡힌다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\nimport { cn } from "@/shared/lib/utils";\n\nexport const value = { Home, cn };\n`;

    const output = await fixedCode(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(importSources(output)).toEqual([
      "@/shared/lib/utils",
      "@/screens/home/ui/home",
    ]);
  });

  it("CSS side-effect import가 섞여도 크래시나 오탐 없이 import/order가 안 걸린다", async () => {
    const code = `import "@/app/globals.css";\nimport { cn } from "@/shared/lib/utils";\nimport { Home } from "@/screens/home/ui/home";\n\nexport const value = { cn, Home };\n`;

    const violations = await violationsOf(code, "src/app/fixture.ts");

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      IMPORT_ORDER,
    );
  });

  it("회귀 — alias로 고친 layout.tsx는 어느 규칙도 안 걸린다", async () => {
    const code = `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "La Bie Belle" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={\`\${geistSans.variable} \${geistMono.variable}\`}>
      <Providers>{children}</Providers>
    </div>
  );
}
`;

    const errors = await errorsOf(code, "src/app/layout.tsx");

    expect(errors).toEqual([]);
  });
});
