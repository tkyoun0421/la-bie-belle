import { describe, expect, it } from "vitest";
import {
  canSubmit,
  fieldHints,
  formatBirthDate,
  formatPhone,
  isValidPhone,
  normalizeBirthInput,
  parseBirthDate,
  toSubmitInput,
  type ProfileFormValues,
} from "@/screens/pending/model/profile-form";

const validValues: ProfileFormValues = {
  displayName: "테스트 이름",
  gender: "female",
  birth: "19930421",
  phone: "010-1234-5678",
};

describe("formatPhone — 숫자만 남겨 010-1234-5678 꼴로 끊는다", () => {
  it("완전한 11자리 숫자를 3-4-4로 끊는다", () => {
    expect(formatPhone("01012345678")).toBe("010-1234-5678");
  });

  it("일곱 자리까지만 친 상태는 010-1234 꼴로 끊는다", () => {
    expect(formatPhone("0101234")).toBe("010-1234");
  });

  it("하이픈이 섞여 들어와도 숫자만 남겨 같은 결과를 낸다", () => {
    expect(formatPhone("010-1234-5678")).toBe("010-1234-5678");
    expect(formatPhone("010-1234-567-8")).toBe("010-1234-5678");
  });

  it("11자리를 넘는 숫자는 뒤를 잘라낸다", () => {
    expect(formatPhone("010123456789")).toBe("010-1234-5678");
  });
});

describe("isValidPhone — 010으로 시작하는 11자리 형식만 유효하다", () => {
  it("010-1234-5678 꼴이면 유효하다", () => {
    expect(isValidPhone("010-1234-5678")).toBe(true);
  });

  it("011로 시작하면 자리 수가 같아도 무효다", () => {
    expect(isValidPhone("011-1234-5678")).toBe(false);
  });
});

describe("normalizeBirthInput — 숫자만 남기고 여덟 자리로 자른다", () => {
  it("숫자가 아닌 문자를 지운다", () => {
    expect(normalizeBirthInput("1993-04-21")).toBe("19930421");
  });

  it("여덟 자리를 넘으면 잘라낸다", () => {
    expect(normalizeBirthInput("199304211")).toBe("19930421");
  });
});

describe("parseBirthDate — 여덟 자리가 실존하는 날짜일 때만 ISO로 바꾼다", () => {
  it("평범한 생년월일을 ISO로 바꾼다", () => {
    expect(parseBirthDate("19930421")).toBe("1993-04-21");
  });

  it("평년의 2월 29일은 실존하지 않아 null이다", () => {
    expect(parseBirthDate("19930229")).toBeNull();
  });

  it("13월처럼 달이 범위를 벗어나면 null이다", () => {
    expect(parseBirthDate("19931301")).toBeNull();
  });

  it("윤년의 2월 29일은 실존해 ISO로 바뀐다", () => {
    expect(parseBirthDate("20000229")).toBe("2000-02-29");
  });

  it("여덟 자리가 안 찬 입력은 null이다", () => {
    expect(parseBirthDate("1993042")).toBeNull();
  });
});

describe("formatBirthDate — ISO 날짜를 점으로 끊어 보여준다", () => {
  it("1993-04-21을 1993.04.21로 바꾼다", () => {
    expect(formatBirthDate("1993-04-21")).toBe("1993.04.21");
  });
});

describe("fieldHints — 손대지 않은 칸은 인도 줄이 없다", () => {
  it("touched가 둘 다 false면 값이 틀려도 null이다", () => {
    const values: ProfileFormValues = {
      ...validValues,
      birth: "1993",
      phone: "010-1234",
    };

    expect(fieldHints(values, { birth: false, phone: false })).toEqual({
      birth: null,
      phone: null,
    });
  });
});

describe("fieldHints — 손댄 칸이 틀리면 문안 표의 문장이 선다", () => {
  it("생년월일이 여덟 자리 날짜가 아니면 그 문장이 선다", () => {
    const values: ProfileFormValues = { ...validValues, birth: "19931301" };

    const hints = fieldHints(values, { birth: true, phone: false });

    expect(hints.birth).toBe("숫자 8자리로 적어 주세요");
  });

  it("연락처가 010 11자리가 아니면 그 문장이 선다", () => {
    const values: ProfileFormValues = {
      ...validValues,
      phone: "011-1234-5678",
    };

    const hints = fieldHints(values, { birth: false, phone: true });

    expect(hints.phone).toBe("010으로 시작하는 11자리예요");
  });
});

describe("fieldHints — 손댔지만 값이 맞으면 인도 줄이 없다", () => {
  it("생년월일과 연락처가 둘 다 맞으면 둘 다 null이다", () => {
    expect(fieldHints(validValues, { birth: true, phone: true })).toEqual({
      birth: null,
      phone: null,
    });
  });
});

describe("canSubmit — 넷이 다 규칙에 맞을 때만 보낼 수 있다", () => {
  it("넷 다 맞으면 true다", () => {
    expect(canSubmit(validValues)).toBe(true);
  });

  it("이름이 빈 문자열이면 false다", () => {
    expect(canSubmit({ ...validValues, displayName: "" })).toBe(false);
  });

  it("이름이 공백만이면 false다", () => {
    expect(canSubmit({ ...validValues, displayName: "   " })).toBe(false);
  });

  it("성별을 안 골랐으면 false다", () => {
    expect(canSubmit({ ...validValues, gender: null })).toBe(false);
  });

  it("생년월일이 실존 날짜가 아니면 false다", () => {
    expect(canSubmit({ ...validValues, birth: "19931301" })).toBe(false);
  });

  it("연락처가 010 11자리가 아니면 false다", () => {
    expect(canSubmit({ ...validValues, phone: "011-1234-5678" })).toBe(false);
  });
});

describe("toSubmitInput — 서버로 보낼 꼴로 바꾼다", () => {
  it("생년월일을 YYYY-MM-DD로 바꿔 나머지 값과 함께 돌려준다", () => {
    expect(toSubmitInput(validValues)).toEqual({
      displayName: "테스트 이름",
      phone: "010-1234-5678",
      birthDate: "1993-04-21",
      gender: "female",
    });
  });
});
