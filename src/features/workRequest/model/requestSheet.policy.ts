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
