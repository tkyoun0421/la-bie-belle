import { RESTRICTED_POSITIONS } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";

/**
 * 사람 시트의 표기다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「사람 시트」다.
 *
 * **성별은 색이 아니라 모양으로 가른다.** lucide의 `Venus`·`Mars`고
 * (`docs/2-design/modules/account/README.md`의 ACC-002) 색 하나로만 말하면 색각 이상인
 * 사람이 못 읽는다.
 *
 * **나이를 세지 않는다.** 연도 뒤 두 자리만 쓰면 생일이 지났는지 해가 바뀌었는지를 화면이
 * 안 따진다(`docs/2-design/design-system/writing.md`의 「숫자와 단위」).
 */

export type Gender = "female" | "male";

export type GenderSymbol = "Venus" | "Mars";

const BIRTH_YEAR_DIGITS = 2;

export function genderSymbol(gender: Gender): GenderSymbol {
  return gender === "female" ? "Venus" : "Mars";
}

export function genderLabel(gender: Gender): string {
  return gender === "female" ? "여" : "남";
}

export function birthYearShort(birthDate: string): string {
  return `${birthDate.slice(4 - BIRTH_YEAR_DIGITS, 4)}년생`;
}

/** 입력 순서가 아니라 README 순서로 낸다 — 사람마다 같은 자리에 같은 이름이 서야 읽힌다. */
export function restrictedQualifications(
  positions: readonly string[],
): string[] {
  return RESTRICTED_POSITIONS.filter((restricted) =>
    positions.includes(restricted),
  );
}
