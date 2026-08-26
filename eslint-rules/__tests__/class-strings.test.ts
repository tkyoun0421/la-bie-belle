import { describe, expect, it } from "vitest";

import {
  arbitraryValueOf,
  classStringVisitor,
  utilityOf,
} from "../class-strings.mjs";

type CollectedToken = { token: string; nodeType: string };

function literal(value: unknown) {
  return { type: "Literal", value };
}

function identifier(name: string) {
  return { type: "Identifier", name };
}

function templateElement(cooked: string) {
  return { type: "TemplateElement", value: { cooked, raw: cooked } };
}

function attribute(name: unknown, value: unknown) {
  return { type: "JSXAttribute", name, value };
}

function jsxIdentifier(name: string) {
  return { type: "JSXIdentifier", name };
}

function callOf(callee: unknown, args: unknown[]) {
  return { type: "CallExpression", callee, arguments: args };
}

function objectOf(properties: unknown[]) {
  return { type: "ObjectExpression", properties };
}

function property(key: unknown, value: unknown) {
  return { type: "Property", key, value };
}

function collector(collected: CollectedToken[]) {
  return (token: string, node: { type: string }) => {
    collected.push({ token, nodeType: node.type });
  };
}

function visitAttribute(node: unknown): CollectedToken[] {
  const collected: CollectedToken[] = [];
  classStringVisitor(collector(collected)).JSXAttribute(node);
  return collected;
}

function visitCall(node: unknown): CollectedToken[] {
  const collected: CollectedToken[] = [];
  classStringVisitor(collector(collected)).CallExpression(node);
  return collected;
}

function tokensOf(collected: CollectedToken[]) {
  return collected.map((entry) => entry.token);
}

describe("utilityOf — 변형 접두사를 벗기고 마지막 유틸리티만 남긴다", () => {
  it.each([
    { token: "flex", utility: "flex" },
    { token: "-mt-2", utility: "-mt-2" },
    { token: "hover:focus:bg-primary", utility: "bg-primary" },
    {
      token: "in-data-[slot=button-group]:rounded-lg",
      utility: "rounded-lg",
    },
    { token: "supports-[display:grid]:grid", utility: "grid" },
    { token: "[&_svg:not([class*='size-'])]:size-4", utility: "size-4" },
    { token: "*:[img:first-child]:rounded-t-xl", utility: "rounded-t-xl" },
    {
      token: "md:hover:[&>*]:text-[color:var(--fg)]",
      utility: "text-[color:var(--fg)]",
    },
    {
      token: "hover:bg-(color:--brand)",
      utility: "bg-(color:--brand)",
    },
  ])("$token 은 $utility 를 남긴다", ({ token, utility }) => {
    expect(utilityOf(token)).toBe(utility);
  });
});

describe("utilityOf — 경계에서 무엇을 돌려주는지", () => {
  it("변형 접두사만 있고 유틸리티가 비면 빈 문자열을 돌려준다", () => {
    expect(utilityOf("hover:")).toBe("");
  });

  it("빈 토큰은 빈 문자열을 돌려준다", () => {
    expect(utilityOf("")).toBe("");
  });

  it("맨 앞 콜론은 빈 접두사로 세고 뒤를 유틸리티로 본다", () => {
    expect(utilityOf(":flex")).toBe("flex");
  });

  it("짝 없는 닫는 대괄호는 깊이를 0 아래로 못 내린다", () => {
    expect(utilityOf("a]:b")).toBe("b");
  });
});

describe("arbitraryValueOf — 첫 대괄호부터 짝이 맞는 곳까지 꺼낸다", () => {
  it.each([
    { utility: "flex", value: null },
    {
      utility: "bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
      value: "color-mix(in_oklch,var(--secondary),var(--foreground)_5%)",
    },
    {
      utility: "rounded-[min(var(--radius-md),12px)]",
      value: "min(var(--radius-md),12px)",
    },
    {
      utility: "grid-cols-[repeat(2,minmax(0,1fr))]",
      value: "repeat(2,minmax(0,1fr))",
    },
    {
      utility: "[&_svg:not([class*='size-'])]",
      value: "&_svg:not([class*='size-'])",
    },
    { utility: "w-[1px]-[2px]", value: "1px" },
  ])("$utility 에서 $value 를 꺼낸다", ({ utility, value }) => {
    expect(arbitraryValueOf(utility)).toBe(value);
  });
});

describe("arbitraryValueOf — 경계에서 무엇을 돌려주는지", () => {
  it("대괄호가 열리기만 하고 안 닫히면 null 을 돌려준다", () => {
    expect(arbitraryValueOf("bg-[foo")).toBeNull();
  });

  it("빈 대괄호는 null 이 아니라 빈 문자열을 돌려준다", () => {
    expect(arbitraryValueOf("w-[]")).toBe("");
  });
});

describe("classStringVisitor — className 속성에서 토큰을 뽑는다", () => {
  it("문자열 리터럴을 공백으로 쪼개고 빈 토큰은 버린다", () => {
    const collected = visitAttribute(
      attribute(jsxIdentifier("className"), literal("  flex   gap-2 ")),
    );

    expect(tokensOf(collected)).toEqual(["flex", "gap-2"]);
  });

  it("class 속성도 같이 본다", () => {
    const collected = visitAttribute(
      attribute(jsxIdentifier("class"), literal("grid")),
    );

    expect(tokensOf(collected)).toEqual(["grid"]);
  });

  it("className 이 아닌 속성은 보지 않는다", () => {
    const collected = visitAttribute(
      attribute(jsxIdentifier("id"), literal("flex")),
    );

    expect(collected).toEqual([]);
  });

  it("값이 없는 속성은 보지 않는다", () => {
    const collected = visitAttribute(
      attribute(jsxIdentifier("className"), null),
    );

    expect(collected).toEqual([]);
  });

  it("JSXIdentifier 가 아닌 이름은 보지 않는다", () => {
    const collected = visitAttribute(
      attribute(
        { type: "JSXNamespacedName", name: jsxIdentifier("className") },
        literal("flex"),
      ),
    );

    expect(collected).toEqual([]);
  });

  it("템플릿 리터럴은 quasi 를 먼저 훑고 표현식 안 문자열을 뒤에 붙인다", () => {
    const collected = visitAttribute(
      attribute(jsxIdentifier("className"), {
        type: "JSXExpressionContainer",
        expression: {
          type: "TemplateLiteral",
          quasis: [templateElement("flex "), templateElement(" rounded-md")],
          expressions: [literal("gap-2")],
        },
      }),
    );

    expect(collected).toEqual([
      { token: "flex", nodeType: "TemplateElement" },
      { token: "rounded-md", nodeType: "TemplateElement" },
      { token: "gap-2", nodeType: "Literal" },
    ]);
  });
});

describe("classStringVisitor — 클래스 헬퍼 호출에서 토큰을 뽑는다", () => {
  it("인자로 받은 문자열을 순서대로 쪼갠다", () => {
    const collected = visitCall(
      callOf(identifier("cn"), [literal("flex gap-2"), literal("rounded-md")]),
    );

    expect(tokensOf(collected)).toEqual(["flex", "gap-2", "rounded-md"]);
  });

  it("중첩 객체 안의 문자열까지 내려가 훑는다", () => {
    const collected = visitCall(
      callOf(identifier("cva"), [
        literal("base-class"),
        objectOf([
          property(
            identifier("variants"),
            objectOf([property(identifier("size"), literal("text-sm"))]),
          ),
        ]),
      ]),
    );

    expect(tokensOf(collected)).toEqual(["base-class", "text-sm"]);
  });

  it("목록에 없는 함수 이름은 보지 않는다", () => {
    const collected = visitCall(
      callOf(identifier("translate"), [literal("flex")]),
    );

    expect(collected).toEqual([]);
  });

  it("멤버 호출은 이름이 같아도 보지 않는다", () => {
    const collected = visitCall(
      callOf(
        {
          type: "MemberExpression",
          object: identifier("styles"),
          property: identifier("cn"),
        },
        [literal("flex")],
      ),
    );

    expect(collected).toEqual([]);
  });

  it("문자열이 아닌 인자는 토큰을 내지 않는다", () => {
    const collected = visitCall(
      callOf(identifier("cn"), [literal(42), identifier("isActive")]),
    );

    expect(collected).toEqual([]);
  });

  it("인자 안에 다른 함수 호출이 끼어도 그 문자열까지 클래스로 센다", () => {
    const collected = visitCall(
      callOf(identifier("cn"), [
        callOf(identifier("translate"), [literal("cart.empty.title")]),
      ]),
    );

    expect(tokensOf(collected)).toEqual(["cart.empty.title"]);
  });
});
