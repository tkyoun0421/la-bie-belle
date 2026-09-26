/**
 * 프로필 다섯 칸 중 값의 꼴이 있는 넷을 본다. 사진은 고른 것이 곧 답이라 꼴이 없다.
 *
 * 규칙의 정본은 `docs/2-design/modules/account/README.md`의 ACC-002와 ACC-004고, 사람에게
 * 보이는 문구는 `docs/2-design/modules/account/screens/login.md`의 「프로필 작성 문안」이다.
 * 문구를 여기 두는 것은 같은 규칙을 화면과 함수가 따로 적지 않게 하려는 것이다.
 *
 * 생년월일은 여덟 자리라는 것만으로는 부족하고 실존해야 한다 — `20260229`는 2026년에 없는
 * 날이다. `Date`에 넣었다 꺼내 같은 값이 나오는지로 본다. 연도를 `setUTCFullYear`로 넣는 것은
 * 생성자가 두 자리 연도를 1900년대로 옮겨 앉히기 때문이다.
 */

export type ProfileGender = "female" | "male";

export type ProfileFormValues = {
  name: string;
  phone: string;
  birthDate: string;
  gender: ProfileGender | null;
};

export type ProfileFormErrors = {
  name?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
};

export const NAME_GUIDE = "이름을 적어 주세요";

export const PHONE_GUIDE = "010으로 시작하는 11자리예요";

export const BIRTH_DATE_GUIDE = "숫자 8자리로 적어 주세요";

export const GENDER_GUIDE = "여 또는 남을 골라 주세요";

const PHONE_DIGITS = /^010\d{8}$/;

const BIRTH_DATE_DIGITS = /^\d{8}$/;

function isRealBirthDate(value: string): boolean {
  if (!BIRTH_DATE_DIGITS.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isProfileGender(value: unknown): value is ProfileGender {
  return value === "female" || value === "male";
}

export function validateProfileForm({
  name,
  phone,
  birthDate,
  gender,
}: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (name.trim() === "") {
    errors.name = NAME_GUIDE;
  }

  if (!PHONE_DIGITS.test(phone)) {
    errors.phone = PHONE_GUIDE;
  }

  if (!isRealBirthDate(birthDate)) {
    errors.birthDate = BIRTH_DATE_GUIDE;
  }

  if (!isProfileGender(gender)) {
    errors.gender = GENDER_GUIDE;
  }

  return errors;
}
