import { DomainError, type ErrorCode } from "@/shared/model/error.type";

/**
 * 오류에 업무 코드가 실렸는지를 묻는다. 실렸으면 업무가 거절한 것이고(`DomainError`) 안
 * 실렸으면 통신이 끊긴 것이다 — 가름의 정본은 [error.type.ts](./error.type.ts)다.
 *
 * **`instanceof`를 화면이 쓰지 않는다.** 같은 가름이 화면마다 `error instanceof DomainError
 * && error.code === "..."`로 다시 적히면 `null` 처리를 한 자리만 빼먹어도 타입이 안 막는다.
 * 묻는 말이 하나라 판정도 하나다.
 */
export function errorCodeOf(error: Error | null): ErrorCode | null {
  return error instanceof DomainError ? error.code : null;
}
