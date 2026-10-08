import {
  BIRTH_DATE_GUIDE,
  GENDER_GUIDE,
  NAME_GUIDE,
  PHONE_GUIDE,
} from "@/entities/profile/consts/profile.const";

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
