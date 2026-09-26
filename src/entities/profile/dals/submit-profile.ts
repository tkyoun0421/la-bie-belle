import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 가입 프로필 다섯 중 넷을 보낸다. 사진은 따로 `update_my_photo`가 든다 —
 * 보낸 뒤에도 고칠 수 있는 값이라 잠기는 넷과 길이 다르다
 * (`docs/2-design/modules/account/design.md` 「프로필 제출·연락처·사진」).
 *
 * 연락처는 하이픈이 든 `010-0000-0000` 꼴로 간다. 칸은 숫자만 받고 하이픈은 앱이 넣는데,
 * 표의 제약과 함수의 검사가 둘 다 그 꼴을 보므로 넘기기 직전에 맞춰 준다.
 */
export type SubmitProfileInput = {
  displayName: string;
  phone: string;
  birthDate: string;
  gender: string;
};

export async function submitProfile(
  client: Db,
  { displayName, phone, birthDate, gender }: SubmitProfileInput,
): Promise<void> {
  const { error } = await client.rpc("submit_profile", {
    display_name: displayName,
    phone,
    birth_date: birthDate,
    gender,
  });

  if (error) {
    throw toApiError(error);
  }
}
