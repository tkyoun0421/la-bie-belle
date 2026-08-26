import { describe, expect, it } from "vitest";
import { fixedCode, violationsOf } from "@tests/lint/rule-check";

const NO_UNUSED_IMPORTS = "unused-imports/no-unused-imports";
const NO_UNUSED_VARS = "unused-imports/no-unused-vars";
const CONSISTENT_TYPE_IMPORTS = "@typescript-eslint/consistent-type-imports";
const UNUSED_IMPORT_RULES = [
  NO_UNUSED_IMPORTS,
  NO_UNUSED_VARS,
  CONSISTENT_TYPE_IMPORTS,
];

function unusedImportRuleIds(ruleIds: string[]) {
  return ruleIds.filter((ruleId) => UNUSED_IMPORT_RULES.includes(ruleId));
}

describe("규칙14 — 미사용 import와 import type", () => {
  it("안 쓰는 named import에 unused-imports/no-unused-imports가 걸리고, --fix 후 그 줄이 사라진다", async () => {
    const code = `import { unused } from "react";\n\nexport const value = 1;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );
    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_UNUSED_IMPORTS,
    );

    const output = await fixedCode(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(output).not.toContain("unused");
  });

  it("일부만 안 쓰는 named import는 --fix 후 쓰는 것만 남는다", async () => {
    const code = `import { used, unused } from "react";\n\nexport const value = used;\n`;

    const output = await fixedCode(
      code,
      "src/entities/profile/model/fixture.ts",
    );
    const importLine = output.match(/import \{([^}]+)\} from "react";/);

    expect(importLine).not.toBeNull();
    const specifiers = (importLine?.[1] ?? "")
      .split(",")
      .map((specifier) => specifier.trim())
      .filter(Boolean);

    expect(specifiers).toEqual(["used"]);
  });

  it("값 자리에서 안 쓰이고 타입 자리에서만 쓰는 import는 @typescript-eslint/consistent-type-imports가 걸리고, --fix 후 import type으로 바뀐다", async () => {
    const code = `import { Profile } from "@/entities/profile/model/profile";\n\nexport function show(profile: Profile) {\n  return profile;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/features/attendance/model/fixture.ts",
    );
    expect(violations.map((violation) => violation.ruleId)).toContain(
      CONSISTENT_TYPE_IMPORTS,
    );

    const output = await fixedCode(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(output).toMatch(
      /import\s+type\s+\{\s*Profile\s*\}|import\s+\{\s*type\s+Profile\s*\}/,
    );
  });

  it("이미 올바른 import { x, type Y }는 규칙14의 어느 규칙도 안 걸린다", async () => {
    const code = `import { useState, type ReactNode } from "react";\n\nexport function useThing(): ReactNode {\n  const [value] = useState<ReactNode>(null);\n  return value;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/features/attendance/model/fixture.ts",
    );

    expect(
      unusedImportRuleIds(violations.map((violation) => violation.ruleId)),
    ).toEqual([]);
  });

  it("회귀 — utils.ts는 이미 inline type을 쓰고 있어 규칙14의 어느 규칙도 안 걸린다", async () => {
    const code = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

    const violations = await violationsOf(code, "src/shared/lib/utils.ts");

    expect(
      unusedImportRuleIds(violations.map((violation) => violation.ruleId)),
    ).toEqual([]);
  });

  it("회귀 — button.tsx는 이미 inline type을 쓰고 있어 규칙14의 어느 규칙도 안 걸린다", async () => {
    const code = `import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva("inline-flex items-center", {
  variants: {
    variant: { default: "bg-primary" },
    size: { default: "h-8" },
  },
  defaultVariants: { variant: "default", size: "default" },
})

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
`;

    const violations = await violationsOf(code, "src/shared/ui/button.tsx");

    expect(
      unusedImportRuleIds(violations.map((violation) => violation.ruleId)),
    ).toEqual([]);
  });
});
