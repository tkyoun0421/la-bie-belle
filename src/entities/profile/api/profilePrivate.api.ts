import type { DB } from "@/shared/api/database";
import type { ProfilePrivateRow } from "@/entities/profile/api/profile.dto";

/**
 * 개인정보가 사는 표는 프로필 표와 갈려 있다 —
 * `docs/2-design/modules/account/design.md`의 「개인정보는 표를 가른다」다. 본인과 관리자만
 * 읽고, RLS가 그것을 이미 막으므로 이 문은 profileId 하나만 받는다.
 *
 * 읽는 자리는 둘이다. 프로필 작성 화면이 거절 뒤·차단 해제 뒤에 지난 값을 굳은 채로 세우려고
 * 제 행을 읽고, 가입 대기 상세 시트가 관리자로서 신청자의 행을 읽는다. 행이 없으면 한 번도
 * 안 보낸 사람이다.
 */
export async function getProfilePrivate(
  client: DB,
  profileId: string,
): Promise<ProfilePrivateRow | null> {
  const { data, error } = await client
    .from("profile_private")
    .select("email, phone, birth_date, gender")
    .eq("profile_id", profileId)
    .maybeSingle<ProfilePrivateRow>();

  if (error) {
    throw error;
  }

  return data;
}
