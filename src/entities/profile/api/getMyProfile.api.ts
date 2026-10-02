import type { DB } from "@/shared/api/database";
import { takeProfileReadFailure } from "@/shared/utils/devDoor";
import type { MyProfileRow } from "@/entities/profile/api/profile.dto";

const COLUMNS = [
  "id",
  "display_name",
  "photo_url",
  "role",
  "submitted_at",
  "approved_at",
  "rejected_at",
  "blocked_at",
  "left_at",
  "notifications_enabled",
].join(", ");

/**
 * 게이트가 읽는 자리다. 여기가 던지면 `decide-entry`가 `/retry`를 고른다.
 *
 * 개발 빌드의 테스트 문이 켜둔 표시를 맨 앞에서 한 번 집는다 — e2e가 통신 단절을 만들 수단이
 * 없어서 「읽기가 실패하면 앱이 어떻게 보이는가」만 확인하는 자리다. 표시를 켜는 문은
 * 프로덕션에 없어서 배포된 앱에서는 이 줄이 늘 지나간다.
 */
export async function getMyProfile(
  client: DB,
  userId: string,
): Promise<MyProfileRow | null> {
  if (takeProfileReadFailure()) {
    throw new Error("simulated_profile_read_failure");
  }

  const { data, error } = await client
    .from("profiles")
    .select(COLUMNS)
    .eq("user_id", userId)
    .maybeSingle<MyProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}
