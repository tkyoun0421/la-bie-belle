import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";
import { PENDING_PATH } from "@/shared/config/auth-routes.config";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const createSupabaseServerClient = vi.fn(async () => ({
  auth: { getUser },
  from,
}));
const findOwnProfile = vi.fn();
const redirect = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("@/entities/identity/api/find-own-profile", () => ({ findOwnProfile }));
vi.mock("next/navigation", () => ({ redirect }));

function validInput(overrides: Partial<Record<string, string>> = {}) {
  return {
    name: "홍길동",
    phone: "010-1234-5678",
    gender: "male",
    birthDate: "1990-01-01",
    ...overrides,
  };
}

beforeEach(() => {
  getUser.mockReset();
  insert.mockReset();
  from.mockClear();
  findOwnProfile.mockReset();
  redirect.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("submitSignup", () => {
  it("미인증 사용자는 COMMON_AUTH_REQUIRED로 거부되고 insert가 호출되지 않는다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { submitSignup } = await import("@/features/signup/api/submit-signup");
    const result = await submitSignup(validInput());

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(insert).not.toHaveBeenCalled();
  });

  it("이미 profile이 있으면 IDENTITY_PROFILE_EXISTS로 거부한다(재호출 거부)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "pending" } });

    const { submitSignup } = await import("@/features/signup/api/submit-signup");
    const result = await submitSignup(validInput());

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_PROFILE_EXISTS });
    expect(insert).not.toHaveBeenCalled();
  });

  it("profile 조회가 실패하면 그 코드를 그대로 전달한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    findOwnProfile.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { submitSignup } = await import("@/features/signup/api/submit-signup");
    const result = await submitSignup(validInput());

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
    expect(insert).not.toHaveBeenCalled();
  });

  it("검증 실패면 IDENTITY_VALIDATION과 필드별 오류를 반환하고 insert하지 않는다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    findOwnProfile.mockResolvedValue({ ok: true, data: null });

    const { submitSignup } = await import("@/features/signup/api/submit-signup");
    const result = await submitSignup(validInput({ name: "   " }));

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("이 테스트는 실패를 전제로 한다");
    }
    expect(result.code).toBe(ERROR_CODE.IDENTITY_VALIDATION);
    expect(result.fieldErrors?.name).toBeTruthy();
    expect(insert).not.toHaveBeenCalled();
  });

  it("유효 입력이면 정규화된 휴대폰으로 pending 행을 insert하고 /pending으로 이동한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    findOwnProfile.mockResolvedValue({ ok: true, data: null });
    insert.mockResolvedValue({ error: null });

    const { submitSignup } = await import("@/features/signup/api/submit-signup");
    await submitSignup(validInput());

    expect(from).toHaveBeenCalledWith("profiles");
    expect(insert).toHaveBeenCalledWith({
      id: "user-1",
      name: "홍길동",
      phone: "01012345678",
      gender: "male",
      birth_date: "1990-01-01",
    });
    expect(redirect).toHaveBeenCalledWith(PENDING_PATH);
  });

  it("휴대폰 unique 위반이면 IDENTITY_PHONE_TAKEN을 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    findOwnProfile.mockResolvedValue({ ok: true, data: null });
    insert.mockResolvedValue({
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "profiles_phone_key"',
      },
    });

    const { submitSignup } = await import("@/features/signup/api/submit-signup");
    const result = await submitSignup(validInput());

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("이 테스트는 실패를 전제로 한다");
    }
    expect(result.code).toBe(ERROR_CODE.IDENTITY_PHONE_TAKEN);
    expect(result.fieldErrors?.phone).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("그 밖의 DB 오류는 COMMON_UNEXPECTED로 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    findOwnProfile.mockResolvedValue({ ok: true, data: null });
    insert.mockResolvedValue({
      error: { code: "23514", message: "check constraint violated" },
    });

    const { submitSignup } = await import("@/features/signup/api/submit-signup");
    const result = await submitSignup(validInput());

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
