import type { Db } from "@/shared/api/database";

/**
 * 개인정보가 사는 표는 프로필 표와 갈려 있다 —
 * `docs/2-design/modules/account/design.md`의 「개인정보는 표를 가른다」다. 본인과 관리자만
 * 읽고, 여기서 읽는 것은 늘 본인 행이다.
 *
 * 프로필 작성 화면이 거절 뒤·차단 해제 뒤에 지난 값을 굳은 채로 세우려고 읽는다. 행이 없으면
 * 한 번도 안 보낸 사람이다.
 */
export type MyProfilePrivateRow = {
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
};

export async function getMyProfilePrivate(
  client: Db,
  profileId: string,
): Promise<MyProfilePrivateRow | null> {
  const { data, error } = await client
    .from("profile_private")
    .select("phone, birth_date, gender")
    .eq("profile_id", profileId)
    .maybeSingle<MyProfilePrivateRow>();

  if (error) {
    throw error;
  }

  return data;
}
