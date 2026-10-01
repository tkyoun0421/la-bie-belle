import type { Db } from "@/shared/api/database";
import { DomainError, toApiError, TransportError } from "@/shared/api/errors";

/**
 * 자기 연락처를 바꾼다. 함수가 아니라 `profile_private` 본인 행 직접 갱신이고, 표 직접
 * 쓰기 정책이 있는 유일한 자리다
 * (`docs/2-design/modules/account/design.md`의 「프로필 제출·연락처·사진」).
 *
 * **마지막 문이 표의 check 제약이다.** 화면이 먼저 꼴을 보지만 그것을 지나온 값도 여기서
 * 한 번 더 걸린다. 걸리면 PostgREST가 `23514`와 제약 이름을 돌려주는데, 그대로 올리면
 * 화면이 「통신이 끊겼다」로 읽어 다시 시도를 권한다 — 다시 시도해도 같은 값은 또 걸린다.
 * 그래서 이 자리가 그 하나를 `invalid_phone`으로 갈라 낸다
 * (`docs/2-design/system/data-access.md`의 「오류의 모양」 예외).
 *
 * **안 바뀐 것을 성공이라 하지 않는다.** RLS는 남의 행을 오류가 아니라 0행으로 돌려줘서,
 * 셈을 안 보면 아무 일도 안 일어난 호출이 조용히 끝난다. 갱신한 행 수를 같이 받아 0이면
 * 던진다.
 */

const CHECK_VIOLATION = "23514";

const PHONE_FORMAT_CONSTRAINT = "profile_private_phone_format";

const NOTHING_CHANGED = "연락처를 바꾸지 못했다 — 갱신된 행이 없다";

type UpdateFailure = { code?: string; message?: string };

function isPhoneFormatViolation(error: unknown): boolean {
  const { code, message } = (error ?? {}) as UpdateFailure;

  return (
    code === CHECK_VIOLATION &&
    (message ?? "").includes(PHONE_FORMAT_CONSTRAINT)
  );
}

export async function updateMyContact(
  client: Db,
  profileId: string,
  phone: string,
): Promise<void> {
  const { error, count } = await client
    .from("profile_private")
    .update({ phone }, { count: "exact" })
    .eq("profile_id", profileId);

  if (error) {
    throw isPhoneFormatViolation(error)
      ? new DomainError("invalid_phone")
      : toApiError(error);
  }

  if (count === 0) {
    throw new TransportError(NOTHING_CHANGED, { profileId });
  }
}
