import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/mutation-settle-shape";

const SERVICE_FILE = "src/features/fixture/services/useFixtureMutation.ts";

const CONTROLLER_FILE = "src/screens/fixture/hooks/useFixtureScreen.ts";

function mutation(settle: string) {
  return [
    'import { queryKeys } from "@/shared/api/queryKeys";',
    'import { staleTogether } from "@/shared/api/queryKeys";',
    "",
    "type Client = {",
    "  invalidateQueries: (filters: { queryKey: unknown }) => Promise<void>;",
    "};",
    "",
    "export function options(queryClient: Client) {",
    "  return {",
    "    mutationFn: async () => undefined,",
    `    ${settle}`,
    "  };",
    "}",
    "",
    "void queryKeys;",
    "void staleTogether;",
  ].join("\n");
}

async function ruleIdsOf(code: string, filePath = SERVICE_FILE) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/mutation-settle-shape", () => {
  it("`onSuccess`가 무효화를 `void`로 던지면 걸린다", async () => {
    const settle =
      "onSuccess: () => {\n      void queryClient.invalidateQueries({ queryKey: queryKeys.member.all });\n    },";

    expect(await ruleIdsOf(mutation(settle))).toContain(RULE_ID);
  });

  it("루프 안에서 `void`로 던지는 것도 걸린다", async () => {
    const settle =
      "onSuccess: () => {\n      for (const queryKey of staleTogether.scheduleWrite) {\n        void queryClient.invalidateQueries({ queryKey });\n      }\n    },";

    expect(await ruleIdsOf(mutation(settle))).toContain(RULE_ID);
  });

  it("`onSuccess`에 붙은 `async`가 걸린다", async () => {
    const settle =
      "onSuccess: async () => {\n      await queryClient.invalidateQueries({ queryKey: queryKeys.member.all });\n    },";

    expect(await ruleIdsOf(mutation(settle))).toContain(RULE_ID);
  });

  it("축약 메서드로 적은 `async onSuccess`도 걸린다", async () => {
    const settle =
      "async onSuccess() {\n      await queryClient.invalidateQueries({ queryKey: queryKeys.member.all });\n    },";

    expect(await ruleIdsOf(mutation(settle))).toContain(RULE_ID);
  });

  it('글자로 적은 `"onSuccess"` 키도 걸린다', async () => {
    const settle =
      '"onSuccess": async () => {\n      await queryClient.invalidateQueries({ queryKey: queryKeys.member.all });\n    },';

    expect(await ruleIdsOf(mutation(settle))).toContain(RULE_ID);
  });

  it("목록을 루프로 돌며 하나씩 기다리면 걸린다", async () => {
    const settle =
      "onSuccess: async () => {\n      for (const queryKey of staleTogether.scheduleWrite) {\n        await queryClient.invalidateQueries({ queryKey });\n      }\n    },";
    const violations = await violationsOf(mutation(settle), SERVICE_FILE);
    const messages = violations
      .filter((violation) => violation.ruleId === RULE_ID)
      .map((violation) => violation.message);

    expect(messages).toHaveLength(2);
    expect(messages.some((message) => message.includes("Promise.all"))).toBe(
      true,
    );
  });

  it("`for await`로 목록을 도는 것도 걸린다", async () => {
    const settle =
      "onSuccess: async () => {\n      for await (const done of staleTogether.scheduleWrite) {\n        void done;\n      }\n    },";

    expect(await ruleIdsOf(mutation(settle))).toContain(RULE_ID);
  });

  it("`while`로 하나씩 기다리는 것도 걸린다", async () => {
    const settle =
      "onSuccess: async () => {\n      let left = 1;\n      while (left > 0) {\n        await queryClient.invalidateQueries({ queryKey: queryKeys.member.all });\n        left -= 1;\n      }\n    },";

    expect(await ruleIdsOf(mutation(settle))).toContain(RULE_ID);
  });

  it("키 하나를 돌려주는 꼴은 통과한다", async () => {
    const settle =
      "onSuccess: () =>\n      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),";

    expect(await ruleIdsOf(mutation(settle))).not.toContain(RULE_ID);
  });

  it("목록을 `Promise.all`로 함께 기다리는 꼴은 통과한다", async () => {
    const settle =
      "onSuccess: () =>\n      Promise.all(\n        staleTogether.scheduleWrite.map((queryKey) =>\n          queryClient.invalidateQueries({ queryKey }),\n        ),\n      ),";

    expect(await ruleIdsOf(mutation(settle))).not.toContain(RULE_ID);
  });

  it("키 여럿을 배열로 묶어 함께 기다리는 꼴도 통과한다", async () => {
    const settle =
      "onSuccess: () =>\n      Promise.all([\n        queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),\n        queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),\n      ]),";

    expect(await ruleIdsOf(mutation(settle))).not.toContain(RULE_ID);
  });

  it("사용자가 누르는 「다시」의 `void`는 `onSuccess` 밖이라 통과한다", async () => {
    const code = [
      'import { staleTogether } from "@/shared/api/queryKeys";',
      "",
      "type Client = {",
      "  invalidateQueries: (filters: { queryKey: unknown }) => Promise<void>;",
      "};",
      "",
      "export function useFixtureScreen(queryClient: Client) {",
      "  return {",
      "    retry: () => {",
      "      for (const queryKey of staleTogether.scheduleWrite) {",
      "        void queryClient.invalidateQueries({ queryKey });",
      "      }",
      "    },",
      "  };",
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code, CONTROLLER_FILE)).not.toContain(RULE_ID);
  });

  it("`onSuccess` 밖의 순차 `await`는 통과한다", async () => {
    const code = [
      'import { staleTogether } from "@/shared/api/queryKeys";',
      "",
      "type Client = {",
      "  invalidateQueries: (filters: { queryKey: unknown }) => Promise<void>;",
      "};",
      "",
      "export async function refresh(queryClient: Client) {",
      "  for (const queryKey of staleTogether.scheduleWrite) {",
      "    await queryClient.invalidateQueries({ queryKey });",
      "  }",
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code, CONTROLLER_FILE)).not.toContain(RULE_ID);
  });

  it("무효화가 아닌 손을 `void`로 던지는 것은 통과한다", async () => {
    const settle =
      "onSuccess: () => {\n      void queryClient.invalidateQueries;\n    },";

    expect(await ruleIdsOf(mutation(settle))).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 기다리는 까닭을 든다", async () => {
    const settle =
      "onSuccess: () => {\n      void queryClient.invalidateQueries({ queryKey: queryKeys.member.all });\n    },";
    const message = (await violationsOf(mutation(settle), SERVICE_FILE)).find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/isSuccess/);
    expect(message).toMatch(/void/);
  });
});
