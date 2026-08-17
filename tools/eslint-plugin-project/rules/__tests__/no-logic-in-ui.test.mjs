import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../no-logic-in-ui.mjs";

const ruleTester = createRuleTester();

const UI_FILE = "src/views/home/ui/HomeView.tsx";

const LOGIC_SAMPLE = `
const count = items.length;
const filtered = items.filter((item) => item.active);
if (count > 0) {
  const remaining = total - used;
}
const at = new Date(value);
`;

describe("no-logic-in-ui (P0-T48 AC17~20 Dumb UI)", () => {
  ruleTester.run("no-logic-in-ui", rule, {
    valid: [
      {
        name: "열거값 === 분기는 판정이 아니라 표현이라 통과한다",
        filename: UI_FILE,
        code: 'if (block.state === "empty") {}',
      },
      {
        name: "열거값 !== 분기도 통과한다",
        filename: UI_FILE,
        code: 'const ok = state !== "loading";',
      },
      {
        name: "JSX 표현식 안의 map은 렌더링이라 통과한다",
        filename: UI_FILE,
        code: "function Rows({ rows }) { return <ul>{rows.map((r) => <Row key={r.id} {...r} />)}</ul>; }",
      },
      {
        name: "논리 연산자 &&로 JSX를 여닫는 것은 통과한다",
        filename: UI_FILE,
        code: "const el = flag && <X />;",
      },
      {
        name: "널 병합 ??는 통과한다",
        filename: UI_FILE,
        code: "const value = a ?? b;",
      },
      {
        name: "옵셔널 체이닝 ?.은 통과한다",
        filename: UI_FILE,
        code: "const name = obj?.name;",
      },
      {
        name: "className 템플릿 리터럴 조합은 통과한다",
        filename: UI_FILE,
        code: "const cls = `base ${size}`;",
      },
      {
        name: "cn()의 className 조합은 통과한다",
        filename: UI_FILE,
        code: 'const cls = cn("a", active && "b");',
      },
      {
        name: "산술 +는 막지 않기로 한 결정이라 통과한다",
        filename: UI_FILE,
        code: "const sum = a + b;",
      },
      {
        name: "model 세그먼트는 대상이 아니라 같은 로직 코드도 통과한다",
        filename: "src/views/home/model/home-blocks.ts",
        code: LOGIC_SAMPLE,
      },
      {
        name: "hooks 세그먼트는 대상이 아니라 같은 로직 코드도 통과한다",
        filename: "src/views/home/hooks/useX.ts",
        code: LOGIC_SAMPLE,
      },
      {
        name: "__tests__ 아래 파일은 면제라 같은 로직 코드도 통과한다",
        filename: "src/views/home/ui/__tests__/HomeView.test.tsx",
        code: LOGIC_SAMPLE,
      },
      {
        name: "*.mock.ts 파일은 면제라 같은 로직 코드도 통과한다",
        filename: "src/views/home/ui/home.mock.ts",
        code: LOGIC_SAMPLE,
      },
    ],
    invalid: [
      {
        name: "비교 연산자 >를 막는다",
        filename: UI_FILE,
        code: "if (count > 0) {}",
        errors: [{ messageId: "comparisonOperator" }],
      },
      {
        name: "비교 연산자 <=를 막는다",
        filename: UI_FILE,
        code: "const ok = a <= b;",
        errors: [{ messageId: "comparisonOperator" }],
      },
      {
        name: "비교 연산자 <를 막는다",
        filename: UI_FILE,
        code: "const ok = x < y;",
        errors: [{ messageId: "comparisonOperator" }],
      },
      {
        name: "비교 연산자 >=를 막는다",
        filename: UI_FILE,
        code: "const ok = x >= y;",
        errors: [{ messageId: "comparisonOperator" }],
      },
      {
        name: "산술 -를 막는다",
        filename: UI_FILE,
        code: "const remaining = total - used;",
        errors: [{ messageId: "arithmeticOperation" }],
      },
      {
        name: "산술 *를 막는다",
        filename: UI_FILE,
        code: "const result = a * b;",
        errors: [{ messageId: "arithmeticOperation" }],
      },
      {
        name: "산술 /를 막는다",
        filename: UI_FILE,
        code: "const result = a / b;",
        errors: [{ messageId: "arithmeticOperation" }],
      },
      {
        name: "산술 %를 막는다",
        filename: UI_FILE,
        code: "const result = a % b;",
        errors: [{ messageId: "arithmeticOperation" }],
      },
      {
        name: "단항 -를 막는다",
        filename: UI_FILE,
        code: "const negated = -x;",
        errors: [{ messageId: "arithmeticOperation" }],
      },
      {
        name: ".length 접근을 막는다",
        filename: UI_FILE,
        code: "const count = items.length;",
        errors: [{ messageId: "lengthAccess" }],
      },
      {
        name: "비교와 함께 쓰인 .length 접근도 막는다",
        filename: UI_FILE,
        code: "if (shifts.length === 0) {}",
        errors: [{ messageId: "lengthAccess" }],
      },
      {
        name: "filter를 막는다",
        filename: UI_FILE,
        code: "list.filter(f);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "reduce를 막는다",
        filename: UI_FILE,
        code: "list.reduce(f, 0);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "sort를 막는다",
        filename: UI_FILE,
        code: "list.sort();",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "slice를 막는다",
        filename: UI_FILE,
        code: "list.slice(0, 3);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "find를 막는다",
        filename: UI_FILE,
        code: "list.find(f);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "some을 막는다",
        filename: UI_FILE,
        code: "list.some(f);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "every를 막는다",
        filename: UI_FILE,
        code: "list.every(f);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "flatMap을 막는다",
        filename: UI_FILE,
        code: "list.flatMap(f);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "JSX 밖에서 변수에 담기는 map은 렌더링이 아니라 막는다",
        filename: UI_FILE,
        code: "const rows = items.map(toRow);",
        errors: [{ messageId: "derivedArrayMethod" }],
      },
      {
        name: "new Date를 막는다",
        filename: UI_FILE,
        code: "new Date(at);",
        errors: [{ messageId: "dateOrFormatCall" }],
      },
      {
        name: "Date.now를 막는다",
        filename: UI_FILE,
        code: "Date.now();",
        errors: [{ messageId: "dateOrFormatCall" }],
      },
      {
        name: "new Intl.NumberFormat을 막는다",
        filename: UI_FILE,
        code: 'new Intl.NumberFormat("ko");',
        errors: [{ messageId: "dateOrFormatCall" }],
      },
      {
        name: "new 없는 Intl.NumberFormat 호출을 막는다",
        filename: UI_FILE,
        code: 'Intl.NumberFormat("ko").format(1000);',
        errors: [{ messageId: "dateOrFormatCall" }],
      },
      {
        name: "new 없는 Intl.DateTimeFormat 호출을 막는다",
        filename: UI_FILE,
        code: 'Intl.DateTimeFormat("ko").format(d);',
        errors: [{ messageId: "dateOrFormatCall" }],
      },
      {
        name: "toLocaleString을 막는다",
        filename: UI_FILE,
        code: "value.toLocaleString();",
        errors: [{ messageId: "dateOrFormatCall" }],
      },
      {
        name: "toLocaleDateString을 막는다",
        filename: UI_FILE,
        code: "at.toLocaleDateString();",
        errors: [{ messageId: "dateOrFormatCall" }],
      },
      {
        name: "toFixed를 막는다",
        filename: UI_FILE,
        code: "n.toFixed(2);",
        errors: [{ messageId: "dateOrFormatCall" }],
      },
    ],
  });
});
