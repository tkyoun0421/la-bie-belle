/**
 * 근무 요청 시트가 정상인지 끝났는지를 가른다
 * (`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「근무 요청 시트 짜임」).
 *
 * **서버가 닫기 전에도 끝난 것으로 본다.** 만료 배치는 매 분 도는데 그 사이에 답할 수 있게
 * 두면 눌러봐야 `request_closed`가 온다 — 화면이 서버 시각으로 먼저 잠근다.
 * 경계는 만료 쪽이라 만료 시각과 같은 순간이면 이미 끝난 요청이다.
 */

export type RequestSheetState = "normal" | "ended";

export type RequestSheetInput = {
  closedAt: string | null;
  expiresAt: string;
  serverNowMs: number;
};

export function requestSheetState({
  closedAt,
  expiresAt,
  serverNowMs,
}: RequestSheetInput): RequestSheetState {
  if (closedAt !== null) {
    return "ended";
  }

  return serverNowMs >= new Date(expiresAt).getTime() ? "ended" : "normal";
}
