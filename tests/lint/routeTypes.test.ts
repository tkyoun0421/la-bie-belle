import { routeTypesViolations } from "@tests/lint/route-types";

const GENERATED = `/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: \`/login\`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: \`/login\`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | \`/login\${\`?\${string}\` | ''}\` | \`/pending\${\`?\${string}\` | ''}\`;
    }
  }
}
`;

describe("라우트 타입 선언 검사 — 네 규칙을 각각 어기면 위반이 잡힌다", () => {
  it("생성된 선언이 온전하면 위반이 없다", () => {
    expect(routeTypesViolations(GENERATED)).toEqual([]);
  });

  it("모듈 보강이 없으면 missing-augmentation 위반이다", () => {
    const declaration = GENERATED.replace("declare module 'expo-router'", "");

    expect(routeTypesViolations(declaration)).toContainEqual({
      type: "missing-augmentation",
    });
  });

  it("__routes 인터페이스가 없으면 missing-interface 위반이다", () => {
    const declaration = GENERATED.replace(
      "interface __routes",
      "interface Other",
    );

    expect(routeTypesViolations(declaration)).toContainEqual({
      type: "missing-interface",
    });
  });

  it("href 멤버가 없으면 missing-href 위반이다", () => {
    const declaration = GENERATED.replace(/^ *href:.*$/m, "");

    expect(routeTypesViolations(declaration)).toContainEqual({
      type: "missing-href",
    });
  });

  /**
   * `Href`가 경로 유니언 없이 서면 `string`으로 떨어져 아무 문자열이나 통과한다 —
   * 이 자리가 조용히 꺼지는 것이 이 task가 고치는 사고다.
   */
  it("href에 경로 리터럴이 하나도 없으면 no-route-literal 위반이다", () => {
    const declaration = GENERATED.replace(
      /^( *href:).*$/m,
      "$1 string | Router.HrefObject;",
    );

    expect(routeTypesViolations(declaration)).toContainEqual({
      type: "no-route-literal",
    });
  });

  it("빈 문자열은 앞 셋을 한꺼번에 낸다 — href가 없으면 경로 리터럴은 안 묻는다", () => {
    expect(routeTypesViolations("")).toEqual([
      { type: "missing-augmentation" },
      { type: "missing-interface" },
      { type: "missing-href" },
    ]);
  });
});
