/**
 * 달력 칸에 도는 점선이 서는 조건이다
 * (`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「달력 순 — 기본」).
 *
 * **내 갈래가 아직 대기 중일 때만 참이다.** 답을 기다린다는 표식이라 내가 이미 답했거나
 * 요청이 닫혔으면 남으면 안 된다.
 *
 * 만료는 여기서 안 본다 — 만료된 갈래도 시트를 열면 「근무 요청이 끝났어요」로 서고,
 * 그 시트로 가는 문이 이 점선이다.
 */

export type IncomingRequest = {
  closed_at: string | null;
  request_candidates: readonly { profile_id: string; status: string }[];
};

export function hasIncomingRequest(
  requests: readonly IncomingRequest[],
  myProfileId: string | null,
): boolean {
  if (myProfileId === null) {
    return false;
  }

  return requests.some(
    (request) =>
      request.closed_at === null &&
      request.request_candidates.some(
        (candidate) =>
          candidate.profile_id === myProfileId &&
          candidate.status === "pending",
      ),
  );
}
