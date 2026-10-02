/**
 * 프로필 칸이 비거나 꼴이 틀렸을 때 그 칸 밑에 서는 문구다. 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「프로필 작성 문안」이고, 검증 함수가
 * 이것을 그대로 반환값에 담는다 — 같은 규칙을 화면과 함수가 따로 적지 않게 한 자리에 둔다.
 */

export const NAME_GUIDE = "이름을 적어 주세요";

export const PHONE_GUIDE = "010으로 시작하는 11자리예요";

export const BIRTH_DATE_GUIDE = "숫자 8자리로 적어 주세요";

export const GENDER_GUIDE = "여 또는 남을 골라 주세요";
