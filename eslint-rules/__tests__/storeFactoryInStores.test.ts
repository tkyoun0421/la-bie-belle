import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/store-factory-in-stores";

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/store-factory-in-stores", () => {
  it("`utils/`가 zustand `create`를 부르면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { create } from "zustand";\n\nexport const fixtureStore = create(() => ({ count: 0 }));\n`,
      "src/shared/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("이름을 바꿔 받아도 같은 공장이라 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { create as createStore } from "zustand";\n\nexport const fixtureStore = createStore(() => ({ count: 0 }));\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("네임스페이스로 받아 부르는 것도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import * as zustand from "zustand";\n\nexport const fixtureStore = zustand.create(() => ({ count: 0 }));\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("타입 인자를 끼워 커링한 꼴도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { create } from "zustand";\n\ntype Fixture = { count: number };\n\nexport const fixtureStore = create<Fixture>()(() => ({ count: 0 }));\n`,
      "src/screens/pending/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`model/`의 `createContext`도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { createContext } from "react";\n\nexport const FixtureContext = createContext<number | null>(null);\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("React를 기본 import로 받아 부르는 것도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import React from "react";\n\nexport const FixtureContext = React.createContext<number | null>(null);\n`,
      "src/shared/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`ui/`에서 Context를 만드는 것도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { createContext } from "react";\n\nexport const FixtureContext = createContext<number | null>(null);\n`,
      "src/shared/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("공장을 재수출로 흘려보내도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export { create } from "zustand";\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`export *`로 흘려보내도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export * from "zustand";\n`,
      "src/entities/profile/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`stores/`의 zustand store는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { create } from "zustand";\n\nexport const useFixtureStore = create(() => ({ count: 0 }));\n`,
      "src/shared/stores/fixture.store.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`stores/`의 Context는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { createContext } from "react";\n\nexport const FixtureContext = createContext<number | null>(null);\n`,
      "src/features/addSheet/stores/sheet.context.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`src/app/`은 세그먼트가 없어 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { createContext } from "react";\n\nexport const FixtureContext = createContext<number | null>(null);\n`,
      "src/app/_layout.tsx",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("직접 만든 `create`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `function create() {\n  return { count: 0 };\n}\n\nexport const fixture = create();\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("딴 데서 온 `createContext`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { createContext } from "@/shared/lib/fixture.lib";\n\nexport const fixture = createContext(null);\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("zustand에서 공장이 아닌 것을 받는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { useStore } from "zustand";\n\nexport const fixture = () => useStore;\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입만 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { createContext } from "react";\n\nexport type Fixture = typeof createContext;\n`,
      "src/entities/profile/model/fixture.type.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("React를 당겨도 공장을 안 부르면 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { useMemo } from "react";\n\nexport const fixture = () => useMemo;\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리와 걸린 공장 이름을 든다", async () => {
    const violations = await violationsOf(
      `import { create } from "zustand";\n\nexport const fixtureStore = create(() => ({ count: 0 }));\n`,
      "src/shared/utils/fixture.utils.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/stores/);
    expect(message).toMatch(/create/);
  });
});
