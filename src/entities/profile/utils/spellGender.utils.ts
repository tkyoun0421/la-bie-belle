import { GENDER_LABEL } from "@/entities/profile/consts/profile.const";
import { isProfileGender } from "@/entities/profile/model/profile.schema";

/**
 * 저장된 성별을 글로 세운다. 네 화면이 같은 글자를 써야 해서 읽는 손도 하나다.
 *
 * **안 든 값은 빈 글이다.** 아직 안 보낸 사람과 퇴사 1년이 지나 비워진 사람은 이 열이 비고
 * (`docs/2-design/modules/account/README.md`의 ACC-010) 그 줄은 값 없이 이름표만 선다.
 * DB 열이 `text`라 꼴을 못 보장하는 것도 같은 자리로 들어온다.
 */
export function spellGender(gender: string | null): string {
  return isProfileGender(gender) ? GENDER_LABEL[gender] : "";
}
