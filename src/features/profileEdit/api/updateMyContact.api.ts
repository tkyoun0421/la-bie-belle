import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { DomainError, TransportError } from "@/shared/model/error.type";

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
  client: DB,
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
