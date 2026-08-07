import { describe, expect, it } from "vitest";

import {
  createWorkerPersonalInfoSchema,
  HourlyWageSchema,
  mapWorkerRpcErrorCode,
  OwnPhoneSchema,
  toWorkerPersonalInfoFieldErrors,
} from "@/entities/identity/model/worker-update";
import { HOURLY_WAGE_MAX, HOURLY_WAGE_MIN } from "@/shared/config/wage.config";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

const VALID_INPUT = {
  name: "김근무",
  phone: "01012345678",
  gender: "male",
  birthDate: "1990-01-01",
};

describe("createWorkerPersonalInfoSchema", () => {
  it("유효한 입력을 통과시킨다", () => {
    const result = createWorkerPersonalInfoSchema(new Date("2026-08-07")).safeParse(VALID_INPUT);

    expect(result.success).toBe(true);
  });

  it("이름이 비어 있으면 거부한다", () => {
    const result = createWorkerPersonalInfoSchema(new Date("2026-08-07")).safeParse({
      ...VALID_INPUT,
      name: "  ",
    });

    expect(result.success).toBe(false);
  });

  it("휴대폰 형식이 올바르지 않으면 거부한다", () => {
    const result = createWorkerPersonalInfoSchema(new Date("2026-08-07")).safeParse({
      ...VALID_INPUT,
      phone: "010-1234-5678",
    });

    expect(result.success).toBe(false);
  });

  it("생년월일이 미래면 거부한다", () => {
    const result = createWorkerPersonalInfoSchema(new Date("2026-08-07")).safeParse({
      ...VALID_INPUT,
      birthDate: "2099-01-01",
    });

    expect(result.success).toBe(false);
  });

  it("성별 값이 아니면 거부한다", () => {
    const result = createWorkerPersonalInfoSchema(new Date("2026-08-07")).safeParse({
      ...VALID_INPUT,
      gender: "other",
    });

    expect(result.success).toBe(false);
  });
});

describe("toWorkerPersonalInfoFieldErrors", () => {
  it("필드별 첫 오류 메시지만 남긴다", () => {
    const result = createWorkerPersonalInfoSchema(new Date("2026-08-07")).safeParse({
      name: "",
      phone: "invalid",
      gender: "other",
      birthDate: "invalid",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    const fieldErrors = toWorkerPersonalInfoFieldErrors(result.error);
    expect(Object.keys(fieldErrors).sort()).toEqual(
      ["birthDate", "gender", "name", "phone"].sort(),
    );
  });
});

describe("OwnPhoneSchema", () => {
  it("유효한 휴대폰 번호를 통과시킨다", () => {
    expect(OwnPhoneSchema.safeParse({ phone: "01098765432" }).success).toBe(true);
  });

  it("형식이 올바르지 않으면 거부한다", () => {
    expect(OwnPhoneSchema.safeParse({ phone: "02-123-4567" }).success).toBe(false);
  });
});

describe("HourlyWageSchema", () => {
  it("허용 범위 안의 정수를 통과시킨다", () => {
    expect(HourlyWageSchema.safeParse({ hourlyWage: 12000 }).success).toBe(true);
  });

  it(`${HOURLY_WAGE_MIN}원 미만은 거부한다`, () => {
    expect(HourlyWageSchema.safeParse({ hourlyWage: 0 }).success).toBe(false);
    expect(HourlyWageSchema.safeParse({ hourlyWage: -1000 }).success).toBe(false);
  });

  it(`${HOURLY_WAGE_MAX}원 초과는 거부한다`, () => {
    expect(HourlyWageSchema.safeParse({ hourlyWage: HOURLY_WAGE_MAX + 1 }).success).toBe(false);
  });

  it("문자열로 들어와도 숫자로 변환한다", () => {
    const result = HourlyWageSchema.safeParse({ hourlyWage: "15000" });
    expect(result.success && result.data.hourlyWage).toBe(15000);
  });
});

describe("mapWorkerRpcErrorCode", () => {
  it("42501(권한 없음)은 COMMON_FORBIDDEN으로 매핑한다", () => {
    expect(mapWorkerRpcErrorCode("42501")).toBe(ERROR_CODE.COMMON_FORBIDDEN);
  });

  it("LB001(시급 범위 위반)은 IDENTITY_VALIDATION으로 매핑한다", () => {
    expect(mapWorkerRpcErrorCode("LB001")).toBe(ERROR_CODE.IDENTITY_VALIDATION);
  });

  it("LB002(비활성 포지션)는 IDENTITY_VALIDATION으로 매핑한다", () => {
    expect(mapWorkerRpcErrorCode("LB002")).toBe(ERROR_CODE.IDENTITY_VALIDATION);
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapWorkerRpcErrorCode("57P01")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
    expect(mapWorkerRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
