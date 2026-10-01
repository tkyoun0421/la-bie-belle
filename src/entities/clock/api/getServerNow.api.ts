import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 서버의 지금이다. 앱이 뜰 때와 앞으로 돌아올 때 한 번씩 부르고, 기기 시각과의 차이를
 * `src/entities/clock/model/serverClock.policy.ts`가 잰다([runtime.md 「서버 시각」](../../../../docs/2-design/system/runtime.md#서버-시각)).
 *
 * **매초 안 부른다.** 카운트다운은 그 차이를 더한 로컬 계산이고 판정은 함수 안의 `now()`다 —
 * 기기 시계를 앞당겨 버튼을 켜도 눌러보면 서버가 막는다.
 *
 * 승인 전 사람도 부른다. 시각은 권한이 아니고, 로그인 직후 대기 화면도 남은 시간을 센다.
 */

export async function getServerNow(client: DB): Promise<string> {
  const { data, error } = await client.rpc("server_now");

  if (error) {
    throw toApiError(error);
  }

  return data;
}
