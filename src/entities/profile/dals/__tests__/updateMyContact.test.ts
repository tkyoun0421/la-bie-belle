import { jest } from "@jest/globals";
import type { DB } from "@/shared/api/database";
import { DomainError, TransportError } from "@/shared/api/errors";
import { updateMyContact } from "@/entities/profile/dals/updateMyContact";

// `profile_private.phone`은 함수가 아니라 본인 행 직접 갱신이다 — check 제약이 마지막 문이라
// 이 DAL이 PostgREST의 23514를 제약 이름으로 갈라 DomainError('invalid_phone')으로 바꾼다.
// 정본은 `docs/2-design/system/data-access.md`의 「오류의 모양」 예외 항목이다.

type FakeError = { code?: string; message: string } | null;

function buildClient(error: FakeError): DB {
  const eq = jest.fn(async () => ({ error }));
  const update = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ update }));

  return { from } as unknown as DB;
}

const CHECK_VIOLATION_ERROR = {
  code: "23514",
  message:
    'new row for relation "profile_private" violates check constraint "profile_private_phone_format"',
};

describe("updateMyContact — profile_private 직접 갱신의 오류를 가른다", () => {
  it("제약 이름이 profile_private_phone_format인 23514는 DomainError('invalid_phone')이다", async () => {
    const client = buildClient(CHECK_VIOLATION_ERROR);

    await expect(
      updateMyContact(client, "profile-1", "010-0000-0009"),
    ).rejects.toBeInstanceOf(DomainError);

    try {
      await updateMyContact(client, "profile-1", "010-0000-0009");
      throw new Error("이 줄에 오면 안 된다 — updateMyContact가 던지지 않았다");
    } catch (error) {
      expect((error as DomainError).code).toBe("invalid_phone");
    }
  });

  it("그 밖의 오류는 TransportError다", async () => {
    const client = buildClient({ code: "50000", message: "connection reset" });

    await expect(
      updateMyContact(client, "profile-1", "010-0000-0009"),
    ).rejects.toBeInstanceOf(TransportError);
  });

  it("오류가 없으면 아무것도 던지지 않고 끝난다", async () => {
    const client = buildClient(null);

    await expect(
      updateMyContact(client, "profile-1", "010-0000-0009"),
    ).resolves.toBeUndefined();
  });
});
