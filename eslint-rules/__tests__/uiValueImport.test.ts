import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/ui-value-import";

const UI_FILE = "src/screens/members/ui/MemberSheet.tsx";

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

describe("house/ui-value-import — ui가 값을 만들지 않는다", () => {
  it("`model`의 판정을 값으로 당기면 걸린다", async () => {
    const code = `import { canSave } from "@/entities/profile/model/canSave.policy";\n\nexport const ok = canSave;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).toContain(RULE_ID);
  });

  it("`utils`의 포맷을 값으로 당기면 걸린다", async () => {
    const code = `import { spellGender } from "@/entities/profile/utils/spellGender.utils";\n\nexport const spell = spellGender;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).toContain(RULE_ID);
  });

  it("같은 슬라이스의 `utils`도 걸린다", async () => {
    const code = `import { spellLeftAt } from "@/screens/members/utils/spellLeftAt.utils";\n\nexport const spell = spellLeftAt;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).toContain(RULE_ID);
  });

  it("`import type`은 통과한다", async () => {
    const code = `import type { Member } from "@/entities/member/model/member.type";\n\nexport type Row = Member;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).not.toContain(RULE_ID);
  });

  it("이름마다 `type`을 붙인 것도 통과한다", async () => {
    const code = `import { type Member, type Qualification } from "@/entities/member/model/member.type";\n\nexport type Row = Member | Qualification;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).not.toContain(RULE_ID);
  });

  it("타입과 값을 섞어 당기면 걸린다", async () => {
    const code = `import { isProfileGender, type ProfileGender } from "@/entities/profile/model/profile.schema";\n\nexport const check = isProfileGender;\nexport type G = ProfileGender;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).toContain(RULE_ID);
  });

  it("controller를 당기는 것은 통과한다", async () => {
    const code = `import { useMemberSheet } from "@/screens/members/hooks/useMemberSheet";\n\nexport const use = useMemberSheet;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).not.toContain(RULE_ID);
  });

  it("`consts`를 당기는 것은 통과한다", async () => {
    const code = `import { MEMBERS_COPY } from "@/screens/members/consts/members.const";\n\nexport const copy = MEMBERS_COPY;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).not.toContain(RULE_ID);
  });

  it("`lib`을 당기는 것은 통과한다", async () => {
    const code = `import { openPhone } from "@/shared/lib/openPhone.lib";\n\nexport const open = openPhone;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).not.toContain(RULE_ID);
  });

  it("`ui` 밖은 이 규칙이 안 본다", async () => {
    const code = `import { spellGender } from "@/entities/profile/utils/spellGender.utils";\n\nexport const spell = spellGender;\n`;

    expect(
      await ruleIdsOf(code, "src/screens/members/hooks/useMemberSheet.ts"),
    ).not.toContain(RULE_ID);
  });

  it("`shared/ui`가 위층 `utils`를 당기면 걸린다", async () => {
    const code = `import { spellGender } from "@/entities/profile/utils/spellGender.utils";\n\nexport const spell = spellGender;\n`;

    expect(await ruleIdsOf(code, "src/shared/ui/Avatar.tsx")).toContain(
      RULE_ID,
    );
  });

  it("`shared/utils`는 어디서 당겨도 통과한다", async () => {
    const code = `import { cn } from "@/shared/utils/cn";\n\nexport const join = cn;\n`;

    expect(await ruleIdsOf(code, "src/shared/ui/Avatar.tsx")).not.toContain(
      RULE_ID,
    );
    expect(await ruleIdsOf(code, UI_FILE)).not.toContain(RULE_ID);
  });

  it("`shared/model`은 면제가 아니다", async () => {
    const code = `import { errorCodeOf } from "@/shared/model/errorCode.policy";\n\nexport const codeOf = errorCodeOf;\n`;

    expect(await ruleIdsOf(code, UI_FILE)).toContain(RULE_ID);
  });

  it("`export ... from`으로 값을 다시 내보내도 걸린다", async () => {
    const code = `export { spellGender } from "@/entities/profile/utils/spellGender.utils";\n`;

    expect(await ruleIdsOf(code, UI_FILE)).toContain(RULE_ID);
  });

  it("규칙 메시지가 controller를 가리킨다", async () => {
    const code = `import { spellGender } from "@/entities/profile/utils/spellGender.utils";\n\nexport const spell = spellGender;\n`;
    const violations = await violationsOf(code, UI_FILE);
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/hooks\/use<조각>\.ts/);
  });
});
