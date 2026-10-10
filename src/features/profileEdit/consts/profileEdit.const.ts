import { TRANSPORT_ERROR_COPY } from "@/shared/consts/error.const";

export const AVATARS_BUCKET = "avatars";

export const PHOTO_EDGE = 512;

export const PHOTO_QUALITY = 0.8;

export const PHOTO_CONTENT_TYPE = "image/jpeg";

export const PHOTO_EXTENSION = "jpg";

export const PHONE_LENGTH = 11;

export const PROFILE_FORM_STEPS = [
  "photo",
  "name",
  "gender",
  "birthDate",
  "phone",
] as const;

export const GENDER_OPTIONS = [
  { value: "female", label: "여" },
  { value: "male", label: "남" },
] as const;

export const FORM_AVATAR_SIZE = 64;

export const CONTACT_SHEET_COPY = {
  title: "연락처",
  inputLabel: "휴대폰 번호",
  placeholder: "01012345678",
  guide: "숫자만 적으면 돼요",
  invalid: "010으로 시작하는 11자리를 적어 주세요",
  sendFailed: TRANSPORT_ERROR_COPY,
  close: "닫기",
  save: "저장",
} as const;

export const PHOTO_SHEET_COPY = {
  title: "사진",
  pick: "사진 고르기",
  useGoogle: "구글 사진으로",
  close: "닫기",
  failed: "사진을 올리지 못했어요. 다시 골라 주세요",
} as const;

export const PROFILE_FORM_COPY = {
  appBarTitle: "프로필",
  signOut: "로그아웃",
  writing: "자신의 프로필을 작성해 주세요",
  reviewing: "아래 정보가 맞나요? 틀린 부분을 누르면 다시 적을 수 있어요",
  greetingSuffix: "님, 반가워요",
  useDefaultPhoto: "기본 사진 쓰기",
  photoFailed: "사진을 올리지 못했어요. 다시 골라 주세요",
  nameLabel: "이름",
  namePlaceholder: "근무표에 뜰 이름",
  genderLabel: "성별",
  birthDateLabel: "생년월일",
  birthDatePlaceholder: "19930421",
  phoneLabel: "연락처",
  phonePlaceholder: "010-0000-0000",
  lockedNote: "이름과 성별과 생년월일은 보내고 나면 못 고쳐요",
  submitHint: "빈 칸을 다 채우면 보낼 수 있어요",
  submitFailed: TRANSPORT_ERROR_COPY,
  submit: "보내기",
} as const;
