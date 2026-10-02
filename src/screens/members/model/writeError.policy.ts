import { errorCodeOf } from "@/shared/model/errorCode.policy";
import { HANDLED_CODES } from "@/screens/members/consts/members.const";

/**
 * 쓰기 넷(이름·역할·퇴사·되돌리기)이 돌려준 오류를 가른다. 정본은
 * `docs/2-design/modules/account/screens/members.md`의 문안 표 셋이다.
 *
 * **서버가 이유를 말해 준 것과 그 밖이 갈린다.** 코드 셋(`has_future_assignments`·
 * `last_admin`·`already_decided`)은 Dialog나 토스트가 그 사실을 말하고, 그 밖은 시트
 * 안에 「보내지 못했어요」가 선다 — 무엇 때문인지 모르는 자리라 다시 누르는 것뿐이다.
 */

export function isUnexpectedWriteError(error: Error | null): boolean {
  return error !== null && !HANDLED_CODES.includes(errorCodeOf(error) ?? "");
}
