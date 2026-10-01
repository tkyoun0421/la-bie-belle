/**
 * 부친 답을 갈래로 나누는 자리다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「푸시 보내기」다.
 *
 * **같은 함수가 두 순간의 답을 받는다.** 부치면 접수증이 먼저 오고, 기기까지 닿았는지는
 * 십오 분쯤 뒤에 접수증을 긁어야 안다 — 두 답의 오류 모양이 같아 갈래도 같다.
 *
 * **폐기는 기기가 등록을 잃은 하나뿐이다.** 갈래를 넓게 잡으면 살아 있는 주소가 사라지고
 * 그 기기는 앱을 다시 켤 때까지 아무것도 못 받는다. 너무 잦은 것은 다음 회차가 다시 부치고,
 * 자격 증명이 틀린 것은 되쏴도 같아 사람이 봐야 하는 넷째 갈래로 뺀다.
 *
 * `node:` import를 안 쓴다 — 이 폴더는 `supabase/functions/_shared/`로 복사돼 Deno로 돈다.
 */

/** 기기가 등록을 잃었다. 주소를 지우는 유일한 사유다. */
const DEVICE_NOT_REGISTERED = "DeviceNotRegistered";

/** 자격 증명이 틀렸다. 되쏴도 같아 재시도에 안 든다. */
const INVALID_CREDENTIALS = "InvalidCredentials";

export type PushResponse =
  | { status: "ok"; id?: string }
  | {
      status: "error";
      message: string;
      details?: { error?: string; fault?: string };
    };

/** 부친(또는 긁은) 답 하나. `id`는 알림 id, `token`은 그 기기의 주소다. */
export type PushOutcome = {
  id: string;
  token: string;
  response: PushResponse;
};

/** 긁을 때 오는 답에는 새 접수증이 없다 — 그때 `receiptId`가 널이다. */
export type PushSuccess = { id: string; receiptId: string | null };

export type PushRetry = { id: string; token: string };

export type PushNeedsReview = { id: string; token: string; message: string };

export type PushResultGroups = {
  success: PushSuccess[];
  discardTokens: string[];
  retry: PushRetry[];
  needsReview: PushNeedsReview[];
};

export function splitPushResults(
  outcomes: readonly PushOutcome[],
): PushResultGroups {
  const groups: PushResultGroups = {
    success: [],
    discardTokens: [],
    retry: [],
    needsReview: [],
  };

  for (const outcome of outcomes) {
    const { response } = outcome;

    if (response.status === "ok") {
      groups.success.push({
        id: outcome.id,
        receiptId: response.id ?? null,
      });
      continue;
    }

    const code = response.details?.error;

    if (code === DEVICE_NOT_REGISTERED) {
      groups.discardTokens.push(outcome.token);
      continue;
    }

    if (code === INVALID_CREDENTIALS) {
      groups.needsReview.push({
        id: outcome.id,
        token: outcome.token,
        message: response.message,
      });
      continue;
    }

    groups.retry.push({ id: outcome.id, token: outcome.token });
  }

  return groups;
}
