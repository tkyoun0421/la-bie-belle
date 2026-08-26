import { describe, expect, it } from "vitest";
import { violationsOf } from "@tests/lint/rule-check";

const NO_RESTRICTED_IMPORTS = "no-restricted-imports";

describe("규칙2 — FSD 역방향 import", () => {
  it("shared가 entities를 import하면 걸린다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport const value = Profile;\n`;

    const violations = await violationsOf(code, "src/shared/lib/fixture.ts");

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("entities가 features를 import하면 걸린다", async () => {
    const code = `import { trackAttendance } from "@/features/attendance/model/attendance";\n\nexport const value = trackAttendance;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("features가 screens를 import하면 걸린다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\n\nexport const value = Home;\n`;

    const violations = await violationsOf(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("screens가 app을 import하면 걸린다", async () => {
    const code = `import { Providers } from "@/app/providers";\n\nexport const value = Providers;\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("app이 screens를 import하면 통과한다", async () => {
    const code = `import { Home } from "@/screens/home/ui/home";\n\nexport const value = Home;\n`;

    const violations = await violationsOf(code, "src/app/fixture.ts");

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("screens가 features를 import하면 통과한다", async () => {
    const code = `import { trackAttendance } from "@/features/attendance/model/attendance";\n\nexport const value = trackAttendance;\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture2.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("features가 entities를 import하면 통과한다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport const value = Profile;\n`;

    const violations = await violationsOf(
      code,
      "src/features/attendance/model/fixture2.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });

  it("entities가 shared를 import하면 통과한다", async () => {
    const code = `import { cn } from "@/shared/lib/utils";\n\nexport const value = cn;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture2.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_RESTRICTED_IMPORTS,
    );
  });
});
