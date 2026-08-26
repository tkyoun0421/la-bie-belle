import { describe, expect, it } from "vitest";
import { violationsOf } from "@tests/lint/rule-check";

const NO_CROSS_SLICE_IMPORT = "house/no-cross-slice-import";

describe("규칙3 — 같은 층 다른 슬라이스 import", () => {
  it("entities/profile이 entities/schedule을 import하면 걸린다", async () => {
    const code = `import { Schedule } from "@/entities/schedule/model/schedule";\n\nexport const value = Schedule;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_CROSS_SLICE_IMPORT,
    );
  });

  it("같은 슬라이스 안 다른 세그먼트 import는 통과한다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport const value = Profile;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/dals/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_CROSS_SLICE_IMPORT,
    );
  });
});
