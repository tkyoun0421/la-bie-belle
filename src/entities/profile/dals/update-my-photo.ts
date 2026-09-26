import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 자기 `profiles.photo_url`을 바꾼다. 파일은 이미 `avatars` 버킷에 올라가 있고 여기는 그
 * 공개 주소를 프로필에 앉히는 자리다 — 관리자도 남의 것은 못 바꾼다.
 */
export async function updateMyPhoto(
  client: Db,
  photoUrl: string,
): Promise<void> {
  const { error } = await client.rpc("update_my_photo", {
    photo_url: photoUrl,
  });

  if (error) {
    throw toApiError(error);
  }
}
