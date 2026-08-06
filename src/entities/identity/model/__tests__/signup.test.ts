import { describe, expect, it } from "vitest";

import {
  createSignupSchema,
  GenderValueSchema,
  normalizePhone,
  toSignupFieldErrors,
} from "@/entities/identity/model/signup";

describe("normalizePhone", () => {
  it("하이픈을 제거하고 숫자만 남긴다", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
  });

  it("공백을 제거하고 숫자만 남긴다", () => {
    expect(normalizePhone("010 1234 5678")).toBe("01012345678");
  });

  it("이미 숫자만 있으면 그대로 반환한다", () => {
    expect(normalizePhone("01012345678")).toBe("01012345678");
  });
});

describe("GenderValueSchema", () => {
  it("male·female을 허용한다", () => {
    expect(GenderValueSchema.safeParse("male").success).toBe(true);
    expect(GenderValueSchema.safeParse("female").success).toBe(true);
  });

  it("등록되지 않은 값은 거부한다", () => {
    expect(GenderValueSchema.safeParse("other").success).toBe(false);
  });
});

describe("createSignupSchema", () => {
  const NOW = new Date("2026-08-06T12:00:00+09:00");

  function validInput(overrides: Partial<Record<string, string>> = {}) {
    return {
      name: "홍길동",
      phone: "01012345678",
      gender: "male",
      birthDate: "1990-01-01",
      ...overrides,
    };
  }

  it("유효한 입력을 통과시킨다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput());

    expect(result.success).toBe(true);
  });

  it("이름이 공백뿐이면 거부한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ name: "   " }));

    expect(result.success).toBe(false);
  });

  it("이름 앞뒤 공백은 잘라 저장한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ name: "  홍길동  " }));

    expect(result.success && result.data.name).toBe("홍길동");
  });

  it("휴대폰 형식이 아니면 거부한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ phone: "0212345678" }));

    expect(result.success).toBe(false);
  });

  it("휴대폰 자릿수가 짧으면 거부한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ phone: "0101234" }));

    expect(result.success).toBe(false);
  });

  it("10자리·11자리 휴대폰을 모두 허용한다", () => {
    expect(createSignupSchema(NOW).safeParse(validInput({ phone: "0101234567" })).success).toBe(
      true,
    );
    expect(createSignupSchema(NOW).safeParse(validInput({ phone: "01012345678" })).success).toBe(
      true,
    );
  });

  it("성별이 male·female이 아니면 거부한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ gender: "other" }));

    expect(result.success).toBe(false);
  });

  it("생년월일 형식이 아니면 거부한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ birthDate: "1990/01/01" }));

    expect(result.success).toBe(false);
  });

  it("존재하지 않는 날짜(2월 30일)를 거부한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ birthDate: "1990-02-30" }));

    expect(result.success).toBe(false);
  });

  it("오늘 날짜의 생년월일은 허용한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ birthDate: "2026-08-06" }));

    expect(result.success).toBe(true);
  });

  it("미래 생년월일은 거부한다", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ birthDate: "2026-08-07" }));

    expect(result.success).toBe(false);
  });

  it("연령 하한을 두지 않는다(최근 생년월일도 허용)", () => {
    const result = createSignupSchema(NOW).safeParse(validInput({ birthDate: "2026-08-01" }));

    expect(result.success).toBe(true);
  });

  it("UTC 자정 전후로 날짜가 바뀌어도 KST 기준 오늘로 판정한다", () => {
    const kstBoundaryNow = new Date("2026-08-05T16:00:00Z");
    const schema = createSignupSchema(kstBoundaryNow);

    expect(schema.safeParse(validInput({ birthDate: "2026-08-06" })).success).toBe(true);
    expect(schema.safeParse(validInput({ birthDate: "2026-08-07" })).success).toBe(false);
  });
});

describe("toSignupFieldErrors", () => {
  const NOW = new Date("2026-08-06T12:00:00+09:00");

  it("필드별 첫 오류 메시지를 반환한다", () => {
    const result = createSignupSchema(NOW).safeParse({
      name: "",
      phone: "abc",
      gender: "other",
      birthDate: "not-a-date",
    });

    if (result.success) {
      throw new Error("이 테스트는 검증 실패를 전제로 한다");
    }

    const fieldErrors = toSignupFieldErrors(result.error);

    expect(Object.keys(fieldErrors)).toEqual(
      expect.arrayContaining(["name", "phone", "gender", "birthDate"]),
    );
    expect(typeof fieldErrors.name).toBe("string");
  });
});
