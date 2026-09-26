/**
 * 토스페이스 SVG를 어디서 어떤 이름으로 받아 오는지 계산한다.
 *
 * 파일 자체는 저장소에 안 들어간다 — 받아 오는 쪽만 두는 근거는
 * `docs/2-design/design-system/illustration.md`의 「토스페이스 사용 규칙」이다. 그래서
 * `pnpm tossface:fetch`가 매번 같은 스무 장을 집어 와야 하고, 그 「같은」을 고정 커밋 해시와
 * 아래 표가 잡는다.
 *
 * 계산이 스크립트가 아니라 여기 사는 것은 `tests/lint/font-subset.ts`와 같은 꼴이다 —
 * `scripts/*.mts`는 짝 테스트를 안 무는 자리라 판정을 거기 두면 검사가 안 걸린다.
 */

export const TOSSFACE_DIR = "assets/tossface";

/** 재배포 조건으로 라이선스 2)항이 요구하는 둘. 받아 온 SVG와 달리 이것은 커밋한다. */
export const TOSSFACE_LICENSE_FILES = ["LICENSE", "COPYRIGHT.md"];

/**
 * `toss/tossface` main의 한 지점이다. 움직이는 참조를 쓰면 같은 명령이 어제와 다른 그림을
 * 가져오고, 그때 바뀐 것이 그림인지 우리 코드인지 가릴 수 없다.
 */
export const TOSSFACE_COMMIT_HASH = "37720aa5cf2ec9a853a9787f29e39002c58cc2e7";

/**
 * illustration.md 「토스페이스 스무 개」 표의 코드포인트다. 뜻과 서는 자리는 그 표가 들고
 * 여기는 무엇을 받아 올지만 든다.
 */
export const TOSSFACE_CODEPOINTS: string[][] = [
  ["1F492"],
  ["1F4C5"],
  ["1F64B"],
  ["23F0"],
  ["1F4CB"],
  ["1FAAA"],
  ["1F465"],
  ["1F4B0"],
  ["1F4F1"],
  ["1F4CA"],
  ["1F4DE"],
  ["1F514"],
  ["1F317"],
  ["1F48D"],
  ["1F511"],
  ["1F44B"],
  ["1F4EE"],
  ["1F4E2"],
  ["1F501"],
  ["1F4DD"],
];

/**
 * 원본 파일 이름 그대로다 — `u` 뒤에 대문자 코드포인트, 조합 이모지는 `_`로 잇는다.
 * 자릿수를 맞추려 0을 채우지 않는다. 뜻으로 이름을 다시 붙이면 원본과의 대조가 끊긴다.
 */
export function codepointToFilename(codepoints: string[]): string {
  return `u${codepoints.map((codepoint) => codepoint.toUpperCase()).join("_")}.svg`;
}

/** 파일이 오는 자리다. GitHub은 경로에 `raw` 한 마디가 있어야 파일을 준다 — 빼면 404다. */
export function tossfaceSourceUrl(
  filename: string,
  commitHash: string = TOSSFACE_COMMIT_HASH,
): string {
  return `https://github.com/toss/tossface/raw/${commitHash}/dist/svg/${filename}`;
}

export function tossfaceFilenames(): string[] {
  return TOSSFACE_CODEPOINTS.map(codepointToFilename);
}
