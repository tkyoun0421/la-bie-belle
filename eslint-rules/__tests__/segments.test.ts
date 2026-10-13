import { readFileSync } from "node:fs";

const ADR_ORDER = [
  "ui",
  "hooks",
  "services",
  "stores",
  "api",
  "model",
  "consts",
  "config",
  "lib",
  "utils",
];

const RULES_THAT_USE_SEGMENTS = [
  "constsSegment",
  "dumbUi",
  "nativeSdkSegment",
  "uiValueImport",
];

const SEGMENT_NAME_ARRAY = new RegExp(
  `\\[\\s*"(?:${ADR_ORDER.join("|")})"(?:\\s*,\\s*"(?:${ADR_ORDER.join("|")})")*\\s*,?\\s*\\]`,
);

describe("세그먼트 목록 하나", () => {
  it("`SEGMENTS`가 ADR-015 순서대로 열 개를 낸다", async () => {
    const {
      // @ts-expect-error 대상 export가 아직 없다
      SEGMENTS,
    } = await import("../segments.mjs");

    expect([...SEGMENTS]).toEqual(ADR_ORDER);
  });

  it.each(RULES_THAT_USE_SEGMENTS)(
    "%s 규칙이 세그먼트 이름 배열을 자기 파일에 따로 들지 않는다",
    (rule) => {
      const source = readFileSync(`eslint-rules/${rule}.mjs`, "utf8");

      expect(source).not.toMatch(SEGMENT_NAME_ARRAY);
    },
  );
});
