import type { DB } from "@/shared/api/database";
import type { RETRY_PATH } from "@/shared/consts/navigation.const";
import type { AuthDestination } from "@/entities/session/model/session.type";

export type EntryDecision = AuthDestination | typeof RETRY_PATH;

export type AuthWindowResult = { type: string; url?: string };

export type GoogleSignInDeps = {
  client: DB;
  openAuthSession?: (
    url: string,
    redirectUri: string,
  ) => Promise<AuthWindowResult>;
  redirectUri?: string;
};

export type GoogleSignInFailure =
  "start_failed" | "cancelled" | "missing_code" | "exchange_failed";

export type GoogleSignInResult =
  { ok: true } | { ok: false; reason: GoogleSignInFailure };

export type GoogleSignInOutcome =
  | { kind: "decided"; destination: EntryDecision }
  | { kind: "cancelled" }
  | { kind: "failed" };
