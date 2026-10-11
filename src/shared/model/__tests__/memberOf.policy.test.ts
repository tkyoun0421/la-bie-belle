import { memberOf } from "@/shared/model/memberOf.policy";

describe("memberOf — 목록에 있는 글자를 참으로 판정한다", () => {
  it("목록에 있는 글자를 주면 참이다", () => {
    const isFruit = memberOf(["apple", "banana"]);

    expect(isFruit("apple")).toBe(true);
  });
});

describe("memberOf — 목록에 없는 글자를 거짓으로 판정한다", () => {
  it("목록에 없는 글자를 주면 거짓이다", () => {
    const isFruit = memberOf(["apple", "banana"]);

    expect(isFruit("grape")).toBe(false);
  });
});

describe("memberOf — null은 거짓이다", () => {
  it("null을 주면 거짓이다", () => {
    const isFruit = memberOf(["apple", "banana"]);

    expect(isFruit(null)).toBe(false);
  });
});

describe("memberOf — undefined는 거짓이다", () => {
  it("undefined를 주면 거짓이다", () => {
    const isFruit = memberOf(["apple", "banana"]);

    expect(isFruit(undefined)).toBe(false);
  });
});

describe("memberOf — 숫자는 글자와 같아 보여도 거짓이다", () => {
  it("목록에 없는 숫자를 주면 거짓이다", () => {
    const isFruit = memberOf(["apple", "banana"]);

    expect(isFruit(1)).toBe(false);
  });

  it("목록의 글자와 같아 보이는 숫자를 주면 거짓이다 — 0은 '0'이 아니다", () => {
    const isZero = memberOf(["0", "1"]);

    expect(isZero(0)).toBe(false);
  });
});

describe("memberOf — 객체와 배열은 거짓이다", () => {
  it("객체를 주면 거짓이다", () => {
    const isFruit = memberOf(["apple", "banana"]);

    expect(isFruit({ value: "apple" })).toBe(false);
  });

  it("배열을 주면 거짓이다", () => {
    const isFruit = memberOf(["apple", "banana"]);

    expect(isFruit(["apple"])).toBe(false);
  });
});

describe("memberOf — 빈 목록으로 만든 가드는 무엇을 줘도 거짓이다", () => {
  it("글자를 줘도 거짓이다", () => {
    const isNothing = memberOf([]);

    expect(isNothing("apple")).toBe(false);
  });

  it("null을 줘도 거짓이다", () => {
    const isNothing = memberOf([]);

    expect(isNothing(null)).toBe(false);
  });

  it("빈 글자를 줘도 거짓이다", () => {
    const isNothing = memberOf([]);

    expect(isNothing("")).toBe(false);
  });
});

describe("memberOf — 같은 손으로 만든 가드 둘이 서로 간섭하지 않는다", () => {
  it("각 가드는 자기 목록만 참으로 판정한다", () => {
    const isFruit = memberOf(["apple", "banana"]);
    const isColor = memberOf(["red", "blue"]);

    expect(isFruit("red")).toBe(false);
    expect(isColor("apple")).toBe(false);
    expect(isFruit("apple")).toBe(true);
    expect(isColor("red")).toBe(true);
  });
});

describe("memberOf — 반환된 가드가 unknown 값을 Member로 좁힌다", () => {
  it("가드를 통과한 값은 Member 전용 표에 바로 쓸 수 있다", () => {
    const isFruit = memberOf<"apple" | "banana">(["apple", "banana"]);
    const koreanNameOf: Record<"apple" | "banana", string> = {
      apple: "사과",
      banana: "바나나",
    };

    function describeFruit(value: unknown): string {
      if (isFruit(value)) {
        return koreanNameOf[value];
      }

      return "모름";
    }

    expect(describeFruit("apple")).toBe("사과");
    expect(describeFruit("grape")).toBe("모름");
  });
});
