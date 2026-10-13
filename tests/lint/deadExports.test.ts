import {
  deadExports,
  describeDeadExport,
  describeExemptionProblem,
  EXEMPT_TEST_ONLY_FILES,
  exemptionProblems,
  parseModule,
  repositoryDeadExports,
  repositoryExemptionRows,
  testOnlyFiles,
} from "@tests/lint/deadExports";

const LIB = "src/shared/lib/clock.lib.ts";

const LIB_SOURCE = `export const NOW = 1;

export function tick() {
  return NOW;
}
`;

const TYPED_SOURCE = `${LIB_SOURCE}
export type Tick = number;
`;

function file(name: string, source: string) {
  return { file: name, source };
}

function deadNames(files: ReturnType<typeof file>[]): string[] {
  return deadExports(files).map(describeDeadExport);
}

describe("모듈이 내고 당기는 이름 읽기", () => {
  it("값과 타입 export를 선언 순서대로 뽑는다", () => {
    expect(parseModule(file(LIB, TYPED_SOURCE)).exports).toEqual([
      "NOW",
      "tick",
      "Tick",
    ]);
  });

  it("타입 export는 따로 가려 낸다", () => {
    expect(parseModule(file(LIB, TYPED_SOURCE)).types).toEqual(["Tick"]);
  });

  it("여러 줄로 쪼갠 import 안의 이름도 당긴 것으로 센다", () => {
    const user = file(
      "src/features/a/hooks/useA.ts",
      `import {
  NOW,
  tick,
} from "@/shared/lib/clock.lib";
`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), user])).toEqual([]);
  });

  it("당기지 않은 이름만 죽은 export로 가린다", () => {
    const user = file(
      "src/features/a/hooks/useA.ts",
      `import { tick } from "@/shared/lib/clock.lib";\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), user])).toEqual([`${LIB}:NOW`]);
  });
});

describe("값 export가 죽었는지 가르는 셈", () => {
  it("어디서도 안 당기면 파일:이름으로 낸다", () => {
    expect(deadNames([file(LIB, LIB_SOURCE)])).toEqual([
      `${LIB}:NOW`,
      `${LIB}:tick`,
    ]);
  });

  it("타입 import가 당긴 타입은 죽은 것이 아니다", () => {
    const user = file(
      "src/features/a/hooks/useA.ts",
      `import type { Tick } from "@/shared/lib/clock.lib";\n`,
    );

    expect(deadNames([file(LIB, TYPED_SOURCE), user])).toEqual([
      `${LIB}:NOW`,
      `${LIB}:tick`,
    ]);
  });

  it("자기 파일에서 쓰는 타입은 아무도 안 당겨도 죽은 것이 아니다", () => {
    const own = file(
      LIB,
      `export type Tick = number;\n\nexport const NOW: Tick = 1;\n`,
    );
    const lone = file(
      "src/shared/lib/lone.lib.ts",
      `export type Lone = number;\n`,
    );

    expect(deadNames([own, lone])).toEqual([
      `${LIB}:NOW`,
      "src/shared/lib/lone.lib.ts:Lone",
    ]);
  });

  it("면제 표가 기다리는 파일은 아무도 안 당겨도 셈에서 뺀다", () => {
    expect(deadExports([file(LIB, LIB_SOURCE)], [], new Set([LIB]))).toEqual(
      [],
    );
  });

  it("`export … from`으로 다시 내보내면 당긴 것이다", () => {
    const barrel = file(
      "src/features/a/hooks/useA.ts",
      `export { NOW, tick } from "@/shared/lib/clock.lib";\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), barrel])).toEqual([]);
  });

  it("`export *`와 네임스페이스 import는 이름 전부를 당긴다", () => {
    const star = file(
      "src/features/a/hooks/useA.ts",
      `export * from "@/shared/lib/clock.lib";\n`,
    );
    const namespace = file(
      "src/features/b/hooks/useB.ts",
      `import * as clock from "@/shared/lib/clock.lib";\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), star])).toEqual([]);
    expect(deadNames([file(LIB, LIB_SOURCE), namespace])).toEqual([]);
  });

  it("`await import()`는 구조분해한 이름만 당긴다", () => {
    const test = file(
      "src/shared/lib/__tests__/clock.lib.test.ts",
      `const { tick } = await import("@/shared/lib/clock.lib");\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), test])).toEqual([`${LIB}:NOW`]);
  });

  it("구조분해 없이 받은 `import()`는 이름 전부를 당긴다", () => {
    const test = file(
      "src/shared/lib/__tests__/clock.lib.test.ts",
      `const clock = await import("@/shared/lib/clock.lib");\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), test])).toEqual([]);
  });

  it("상대 경로 import도 같은 파일로 푼다", () => {
    const test = file(
      "src/shared/lib/__tests__/clock.lib.test.ts",
      `import { NOW, tick } from "../clock.lib";\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), test])).toEqual([]);
  });

  it("테스트가 당겨도 당긴 것이다", () => {
    const test = file(
      "src/shared/lib/__tests__/clock.lib.test.ts",
      `import { NOW, tick } from "@/shared/lib/clock.lib";\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), test])).toEqual([]);
  });

  it("라우트와 `index.ts`와 Deno로 복사되는 폴더는 셈 밖이다", () => {
    const route = file("src/app/login.tsx", `export const unused = 1;\n`);
    const index = file("src/shared/lib/index.ts", `export const unused = 1;\n`);
    const edge = file("src/shared/model/pick.ts", `export const unused = 1;\n`);

    expect(deadExports([route, index, edge], ["src/shared/model"])).toEqual([]);
  });

  it("jest.mock 지정자는 파일을 당기되 이름은 당기지 않는다", () => {
    const test = file(
      "src/shared/lib/__tests__/user.test.ts",
      `jest.unstable_mockModule("@/shared/lib/clock.lib", () => ({ NOW: 1 }));\n`,
    );

    expect(deadNames([file(LIB, LIB_SOURCE), test])).toEqual([
      `${LIB}:NOW`,
      `${LIB}:tick`,
    ]);
    expect(testOnlyFiles([file(LIB, LIB_SOURCE), test])).toEqual([LIB]);
  });
});

describe("프로덕션이 안 당기는 파일 가리기", () => {
  const test = file(
    "src/shared/lib/__tests__/clock.lib.test.ts",
    `import { tick } from "@/shared/lib/clock.lib";\n`,
  );

  it("테스트만 당기는 파일을 낸다", () => {
    expect(testOnlyFiles([file(LIB, LIB_SOURCE), test])).toEqual([LIB]);
  });

  it("프로덕션 파일 하나라도 당기면 낸 목록에서 빠진다", () => {
    const production = file(
      "src/features/a/hooks/useA.ts",
      `import { tick } from "@/shared/lib/clock.lib";\n`,
    );

    expect(testOnlyFiles([file(LIB, LIB_SOURCE), test, production])).toEqual(
      [],
    );
  });

  it("아무도 안 당기는 파일은 테스트만 당기는 것이 아니다", () => {
    expect(testOnlyFiles([file(LIB, LIB_SOURCE)])).toEqual([]);
  });
});

describe("면제 표 검사", () => {
  const rows = {
    openBacklogRows: new Set(["attendance-checkin"]),
    allBacklogRows: new Set(["attendance-checkin", "login-screens"]),
    openObservations: new Set(["observations/028-open"]),
    allObservations: new Set([
      "observations/028-open",
      "observations/030-done",
    ]),
  };

  it("표에 없는 파일은 이름을 달라고 걸린다", () => {
    expect(exemptionProblems([LIB], new Set([LIB]), {}, rows)).toEqual([
      { file: LIB, kind: "unlisted" },
    ]);
  });

  it("열린 행 이름을 단 파일은 통과한다", () => {
    expect(
      exemptionProblems(
        [LIB],
        new Set([LIB]),
        { [LIB]: "attendance-checkin" },
        rows,
      ),
    ).toEqual([]);
  });

  it("닫힌 행과 없는 행은 따로 가린다", () => {
    expect(
      exemptionProblems(
        [LIB],
        new Set([LIB]),
        { [LIB]: "login-screens" },
        rows,
      ),
    ).toEqual([{ file: LIB, kind: "closed-row", row: "login-screens" }]);
    expect(
      exemptionProblems([LIB], new Set([LIB]), { [LIB]: "ghost" }, rows),
    ).toEqual([{ file: LIB, kind: "unknown-row", row: "ghost" }]);
  });

  it("관찰 키는 status가 open일 때만 통과한다", () => {
    expect(
      exemptionProblems(
        [LIB],
        new Set([LIB]),
        { [LIB]: "observations/028-open" },
        rows,
      ),
    ).toEqual([]);
    expect(
      exemptionProblems(
        [LIB],
        new Set([LIB]),
        { [LIB]: "observations/030-done" },
        rows,
      ),
    ).toEqual([
      { file: LIB, kind: "closed-row", row: "observations/030-done" },
    ]);
  });

  it("이제 프로덕션이 당기는 파일이 표에 남으면 낡은 면제로 걸린다", () => {
    expect(
      exemptionProblems([], new Set(), { [LIB]: "attendance-checkin" }, rows),
    ).toEqual([{ file: LIB, kind: "stale", row: "attendance-checkin" }]);
  });
});

describe("src의 죽은 export", () => {
  const { dead, testOnly, unproduced } = repositoryDeadExports();

  it("어떤 파일도 안 당기는 값 export가 없다", () => {
    expect(dead.map(describeDeadExport)).toEqual([]);
  });

  it("테스트만 당기는 파일은 열린 행 이름을 단 면제 표에 든 것뿐이다", () => {
    expect(
      exemptionProblems(
        testOnly,
        unproduced,
        EXEMPT_TEST_ONLY_FILES,
        repositoryExemptionRows(),
      ).map(describeExemptionProblem),
    ).toEqual([]);
  });
});
