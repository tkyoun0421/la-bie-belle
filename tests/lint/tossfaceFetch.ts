export const TOSSFACE_DIR = "assets/tossface";

export const TOSSFACE_LICENSE_FILES = ["LICENSE", "COPYRIGHT.md"];

export const TOSSFACE_COMMIT_HASH = "37720aa5cf2ec9a853a9787f29e39002c58cc2e7";

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

export function codepointToFilename(codepoints: string[]): string {
  return `u${codepoints.map((codepoint) => codepoint.toUpperCase()).join("_")}.svg`;
}

export function tossfaceSourceUrl(
  filename: string,
  commitHash: string = TOSSFACE_COMMIT_HASH,
): string {
  return `https://github.com/toss/tossface/raw/${commitHash}/dist/svg/${filename}`;
}

export function tossfaceFilenames(): string[] {
  return TOSSFACE_CODEPOINTS.map(codepointToFilename);
}
