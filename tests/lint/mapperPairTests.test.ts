import {
  describeMapperPairViolation,
  executableExportsOf,
  mapperPairViolations,
  MAPPER_SUFFIX,
  pairTestOf,
  repositoryMapperFiles,
  repositoryMapperPairViolations,
} from "@tests/lint/mapperPairTests";

const MAPPER = "src/entities/hall/utils/hall.mapper.ts";

const PAIR_TEST = "src/entities/hall/utils/__tests__/hall.mapper.test.ts";

const MAPPER_SOURCE = `import type { HallRow } from "@/entities/hall/api/hall.dto";

export function toHallDefaults(row: HallRow) {
  return { slots: row.default_slots };
}
`;

const PULL = `import { toHallDefaults } from "@/entities/hall/utils/hall.mapper";
`;

const CALLING_TEST = {
  file: PAIR_TEST,
  source: `${PULL}
describe("toHallDefaults", () => {
  it("자리를 옮긴다", () => {
    expect(toHallDefaults({ default_slots: [] }).slots).toEqual([]);
  });
});
`,
};

const GROWN_MAPPER_SOURCE = `${MAPPER_SOURCE}
export function toHallSlot(row: HallRow) {
  return row.default_slots[0];
}
`;

const STRANGER_TEST = {
  file: PAIR_TEST,
  source: `import { hallLabel } from "@/entities/hall/utils/hallLabel.utils";

describe("hallLabel", () => {
  it("이름을 낸다", () => {
    expect(hallLabel()).toBe("홀");
  });
});
`,
};

describe("짝 테스트의 자리", () => {
  it("매퍼 옆 `__tests__`의 같은 이름이다", () => {
    expect(pairTestOf(MAPPER)).toBe(PAIR_TEST);
  });

  it("매퍼를 가리키는 접미사가 정해져 있다", () => {
    expect(MAPPER_SUFFIX).toBe(".mapper.ts");
  });
});

describe("내보내는 실행 코드의 이름", () => {
  it("함수 선언을 뽑는다", () => {
    expect(executableExportsOf(MAPPER_SOURCE)).toEqual(["toHallDefaults"]);
  });

  it("화살표 함수와 `async`도 뽑는다", () => {
    const source = `export const toSlot = (row: Row) => row;
export async function toDay(row: Row) {
  return row;
}
`;

    expect(executableExportsOf(source)).toEqual(["toSlot", "toDay"]);
  });

  it("타입과 값만 내보내는 것은 실행 코드가 아니다", () => {
    const source = `export type Slot = { id: string };
export const MINUTES = 5;
`;

    expect(executableExportsOf(source)).toEqual([]);
  });
});

describe("매퍼마다 옆 `__tests__`가 그것을 당겨야 한다", () => {
  it("테스트가 아예 없으면 어디에 쓸지 가리킨다", () => {
    expect(
      mapperPairViolations([{ file: MAPPER, source: MAPPER_SOURCE }]),
    ).toEqual([{ type: "missing-test", file: MAPPER, expected: PAIR_TEST }]);
  });

  it("옆에 테스트가 있어도 그 매퍼를 안 당기면 없는 것과 같다", () => {
    expect(
      mapperPairViolations([
        { file: MAPPER, source: MAPPER_SOURCE },
        STRANGER_TEST,
      ]),
    ).toEqual([{ type: "missing-test", file: MAPPER, expected: PAIR_TEST }]);
  });

  it("매퍼에 함수를 얹고 단언을 안 쓰면 그 이름만 걸린다", () => {
    expect(
      mapperPairViolations([
        { file: MAPPER, source: GROWN_MAPPER_SOURCE },
        CALLING_TEST,
      ]),
    ).toEqual([
      {
        type: "uncalled-export",
        file: MAPPER,
        expected: PAIR_TEST,
        name: "toHallSlot",
      },
    ]);
  });

  it("내보낸 이름을 부르면 위반이 없다", () => {
    expect(
      mapperPairViolations([
        { file: MAPPER, source: MAPPER_SOURCE },
        CALLING_TEST,
      ]),
    ).toEqual([]);
  });

  it("같은 `__tests__`의 다른 이름이 불러도 지켜진다", () => {
    expect(
      mapperPairViolations([
        { file: MAPPER, source: MAPPER_SOURCE },
        {
          file: "src/entities/hall/utils/__tests__/hallDefaults.mapper.test.ts",
          source: CALLING_TEST.source,
        },
      ]),
    ).toEqual([]);
  });

  it("다른 폴더의 테스트는 짝이 아니다", () => {
    expect(
      mapperPairViolations([
        { file: MAPPER, source: MAPPER_SOURCE },
        {
          file: "src/entities/hall/hooks/__tests__/useHall.test.ts",
          source: CALLING_TEST.source,
        },
      ]),
    ).toEqual([{ type: "missing-test", file: MAPPER, expected: PAIR_TEST }]);
  });

  it("매퍼가 아닌 파일은 안 본다", () => {
    expect(
      mapperPairViolations([
        {
          file: "src/entities/hall/utils/hallLabel.utils.ts",
          source: "export function hallLabel() {\n  return '홀';\n}\n",
        },
      ]),
    ).toEqual([]);
  });

  it("짝 테스트 자신은 매퍼로 세지 않는다", () => {
    expect(mapperPairViolations([CALLING_TEST])).toEqual([]);
  });
});

describe("위반을 사람이 읽는 문장으로 옮긴다", () => {
  it("짝 테스트가 없으면 쓸 자리를 가리킨다", () => {
    const message = describeMapperPairViolation({
      type: "missing-test",
      file: MAPPER,
      expected: PAIR_TEST,
    });

    expect(message).toContain(MAPPER);
    expect(message).toContain(PAIR_TEST);
  });

  it("안 불린 이름은 그 이름과 쓸 자리를 같이 든다", () => {
    const message = describeMapperPairViolation({
      type: "uncalled-export",
      file: MAPPER,
      expected: PAIR_TEST,
      name: "toHallDefaults",
    });

    expect(message).toContain("toHallDefaults");
    expect(message).toContain(PAIR_TEST);
  });
});

describe("저장소 실물 — 매퍼 전부가 짝 테스트에 불린다", () => {
  it("위반이 없다", () => {
    expect(
      repositoryMapperPairViolations().map(describeMapperPairViolation),
    ).toEqual([]);
  });

  it("셀 매퍼가 실제로 있다", () => {
    expect(repositoryMapperFiles().length).toBeGreaterThan(10);
  });
});
