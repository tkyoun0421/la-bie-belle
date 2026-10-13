import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { DomainError, TransportError } from "@/shared/model/errors";

const CHECK_VIOLATION = "23514";

const PHONE_FORMAT_CONSTRAINT = "profile_private_phone_format";

const NOTHING_CHANGED = "연락처를 바꾸지 못했다 — 갱신된 행이 없다";

function isPhoneFormatViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? error.code : null;
  const message = "message" in error ? error.message : null;

  return (
    code === CHECK_VIOLATION &&
    typeof message === "string" &&
    message.includes(PHONE_FORMAT_CONSTRAINT)
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
