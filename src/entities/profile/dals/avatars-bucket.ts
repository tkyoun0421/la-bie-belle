import "react-native-get-random-values";
import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 본인이 올린 사진이 사는 자리다. 정본은
 * `docs/2-design/modules/account/design.md`의 「사진 저장」이다.
 *
 * 쓰는 자리는 제 `<user_id>/` 폴더뿐이고 읽기는 공개다. 파일 이름에 임의의 열여섯 바이트가
 * 들어 있어 주소를 추측으로는 못 연다. 올린 뒤 공개 주소를 그대로 돌려주는 것은 부르는 쪽이
 * 그 값을 `update_my_photo`에 그대로 넘기기 때문이다 — 주소를 만드는 규칙이 화면으로 새지
 * 않는다.
 *
 * **바이트로 읽어 올린다.** 앱에는 브라우저가 파일을 담아 넘기던 그릇이 없어서, 폼 데이터에
 * 파일을 얹는 길로는 빈 파일이 올라간다. 줄이는 것은 기기 쪽 일이라 화면이 하고, 여기는 이미
 * 줄어든 파일의 주소를 받는다 — 버킷의 1MB 상한이 그 전제의 뒷문이다.
 */

export const AVATARS_BUCKET = "avatars";

const NAME_BYTES = 16;

function randomFileName(extension: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(NAME_BYTES));
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `${hex}.${extension}`;
}

export type UploadAvatarInput = {
  userId: string;
  uri: string;
  contentType: string;
  extension: string;
};

export async function uploadAvatar(
  client: Db,
  { userId, uri, contentType, extension }: UploadAvatarInput,
): Promise<string> {
  const bytes = await (await fetch(uri)).arrayBuffer();
  const path = `${userId}/${randomFileName(extension)}`;
  const bucket = client.storage.from(AVATARS_BUCKET);

  const { error } = await bucket.upload(path, bytes, { contentType });

  if (error) {
    throw toApiError(error);
  }

  return bucket.getPublicUrl(path).data.publicUrl;
}
