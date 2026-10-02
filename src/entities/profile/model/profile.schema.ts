import {
  BIRTH_DATE_GUIDE,
  GENDER_GUIDE,
  NAME_GUIDE,
  PHONE_GUIDE,
} from "@/entities/profile/consts/profile.const";

/**
 * 프로필 다섯 칸 중 값의 꼴이 있는 넷을 본다. 사진은 고른 것이 곧 답이라 꼴이 없다.
 *
 * 규칙의 정본은 `docs/2-design/modules/account/README.md`의 ACC-002와 ACC-004고, 틀렸을 때
 * 서는 문구는 [`consts`](../consts/profile.const.ts)가 든다 — 화면과 이 함수가 같은 문장을
 * 따로 적지 않게 한 자리다.
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

/** 연락처만 따로 보는 자리가 있다 — 「나」의 연락처 시트는 다섯 중 하나만 고친다. */
export function isValidPhone(phone: string): boolean {
  return PHONE_DIGITS.test(phone);
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

  if (!isValidPhone(phone)) {
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
