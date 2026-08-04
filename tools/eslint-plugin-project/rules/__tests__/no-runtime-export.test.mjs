import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../no-runtime-export.mjs";

const ruleTester = createRuleTester();

describe("no-runtime-export", () => {
  ruleTester.run("no-runtime-export", rule, {
    valid: [
      {
        name: "types 세그먼트의 타입 export는 허용한다",
        filename: "src/entities/shift/types/shift.ts",
        code: "export type Shift = { id: string };",
      },
      {
        name: "types 세그먼트의 interface export는 허용한다",
        filename: "src/entities/shift/types/shift.ts",
        code: "export interface Shift { id: string }",
      },
      {
        name: "types 세그먼트의 type-only 재export는 허용한다",
        filename: "src/entities/shift/types/shift.ts",
        code: 'export type { User } from "../../user/types/user";',
      },
      {
        name: "config 세그먼트의 상수 선언은 허용한다",
        filename: "src/shared/config/limits.ts",
        code: "export const MAX = 10;",
      },
      {
        name: "config 세그먼트의 객체 상수도 허용한다",
        filename: "src/shared/config/limits.ts",
        code: "export const LIMITS = { max: 10, min: 1 };",
      },
      {
        name: "런타임 export가 허용된 세그먼트는 판정하지 않는다",
        filename: "src/entities/shift/model/shift.ts",
        code: "export function make() { return 1; }",
      },
      {
        name: "면제 경로는 판정하지 않는다",
        filename: "src/shared/api/generated/database.types.ts",
        code: "export function make() { return 1; }",
      },
    ],
    invalid: [
      {
        name: "types 세그먼트의 함수 export를 막는다",
        filename: "src/entities/shift/types/shift.ts",
        code: "export function make() { return 1; }",
        errors: [{ messageId: "runtimeExport" }],
      },
      {
        name: "types 세그먼트의 const export를 막는다",
        filename: "src/entities/shift/types/shift.ts",
        code: "export const DEFAULT = 1;",
        errors: [{ messageId: "runtimeExport" }],
      },
      {
        name: "types 세그먼트의 class export를 막는다",
        filename: "src/entities/shift/types/shift.ts",
        code: "export class Shift {}",
        errors: [{ messageId: "runtimeExport" }],
      },
      {
        name: "types 세그먼트의 default export를 막는다",
        filename: "src/entities/shift/types/shift.ts",
        code: "export default 1;",
        errors: [{ messageId: "runtimeExport" }],
      },
      {
        name: "config 세그먼트의 함수 export를 막는다",
        filename: "src/shared/config/limits.ts",
        code: "export function compute() { return 1; }",
        errors: [{ messageId: "constantsOnly" }],
      },
      {
        name: "config 세그먼트의 화살표 함수 상수도 막는다",
        filename: "src/shared/config/limits.ts",
        code: "export const compute = () => 1;",
        errors: [{ messageId: "constantsOnly" }],
      },
      {
        name: "config 세그먼트의 클래스 export를 막는다",
        filename: "src/shared/config/limits.ts",
        code: "export class Limits {}",
        errors: [{ messageId: "constantsOnly" }],
      },
      {
        name: "값 재export도 막는다",
        filename: "src/entities/shift/types/shift.ts",
        code: 'export { helper } from "../model/shift";',
        errors: [{ messageId: "runtimeExport" }],
      },
    ],
  });
});
