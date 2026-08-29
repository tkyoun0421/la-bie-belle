import {
  PALETTE_HEADER,
  requireRows,
  ROLE_HEADER,
} from "@scripts/tokens-md.mts";

export type Theme = "light" | "dark";
export type Combo = { left: string; right: string };
export type DroppedCombo = Combo & { theme: Theme };

export type MeasuredContrastRow = {
  combo: Combo;
  reported: { light: number; dark: number };
  recomputed: { light: number; dark: number };
};

export type DroppedContrastRow = {
  combo: DroppedCombo;
  reported: number;
  recomputed: number;
};

const MEASURED_HEADER = ["조합", "라이트", "다크"];
const DROPPED_HEADER = ["조합", "결과", "판정"];

const COMBO_COLUMN = 0;
const MEASURED_RATIO_COLUMN: Record<Theme, number> = { light: 1, dark: 2 };
const DROPPED_RATIO_COLUMN = 1;
const ROLE_PALETTE_COLUMN = 1;
const PALETTE_HEX_COLUMN: Record<Theme, number> = { light: 1, dark: 3 };

const COMBO_SEPARATOR = /\s+(?:on|vs)\s+/;
const THEME_SUFFIXES: { suffix: string; theme: Theme }[] = [
  { suffix: "(라이트)", theme: "light" },
  { suffix: "(다크)", theme: "dark" },
];

const SIX_HEX_DIGITS = /^[0-9a-fA-F]{6}$/;
const SRGB_LINEAR_CUTOFF = 0.03928;
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722];
const LUMINANCE_OFFSET = 0.05;

function channelsOf(hex: string): number[] {
  const digits = hex.trim().replace(/^#/, "");
  if (!SIX_HEX_DIGITS.test(digits)) {
    throw new Error(`여섯 자리 hex로 읽을 수 없는 색이다: ${hex}`);
  }
  return [0, 2, 4].map(
    (start) => Number.parseInt(digits.slice(start, start + 2), 16) / 255,
  );
}

function linearize(channel: number): number {
  return channel <= SRGB_LINEAR_CUTOFF
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  return channelsOf(hex).reduce(
    (total, channel, index) =>
      total + LUMINANCE_WEIGHTS[index] * linearize(channel),
    0,
  );
}

export function contrastRatio(hexA: string, hexB: string): number {
  const [darker, lighter] = [
    relativeLuminance(hexA),
    relativeLuminance(hexB),
  ].sort((a, b) => a - b);

  return (lighter + LUMINANCE_OFFSET) / (darker + LUMINANCE_OFFSET);
}

export function parseComboCell(comboText: string): Combo {
  const [left, right, ...rest] = comboText
    .replaceAll("`", "")
    .split(COMBO_SEPARATOR);

  if (right === undefined || rest.length > 0) {
    throw new Error(
      `조합 셀을 " on " 이나 " vs " 로 가르지 못했다: ${comboText}`,
    );
  }

  return { left: left.trim(), right: right.trim() };
}

export function parseDroppedComboCell(comboText: string): DroppedCombo {
  const trimmed = comboText.trim();
  const tail = THEME_SUFFIXES.find((candidate) =>
    trimmed.endsWith(candidate.suffix),
  );

  if (!tail) {
    throw new Error(
      `조합 셀 끝에서 (라이트)나 (다크) 꼬리를 찾지 못했다: ${comboText}`,
    );
  }

  return {
    ...parseComboCell(trimmed.slice(0, -tail.suffix.length)),
    theme: tail.theme,
  };
}

function paletteStepOf(markdown: string, roleToken: string): string {
  const row = requireRows(markdown, ROLE_HEADER, "역할 토큰").find(
    (candidate) => candidate.cells[COMBO_COLUMN] === roleToken,
  );

  if (!row) {
    throw new Error(`역할 토큰 ${roleToken} 을 tokens.md 2절에서 찾지 못했다.`);
  }

  return row.cells[ROLE_PALETTE_COLUMN];
}

export function resolveTokenHex(
  markdown: string,
  tokenOrStep: string,
  theme: Theme,
): string {
  const step = tokenOrStep.includes(".")
    ? paletteStepOf(markdown, tokenOrStep)
    : tokenOrStep;

  const boundary = step.lastIndexOf("-");
  const series = step.slice(0, boundary);
  const level = step.slice(boundary + 1);

  const row = requireRows(markdown, PALETTE_HEADER, "팔레트").find(
    (candidate) => candidate.section === series && candidate.cells[0] === level,
  );

  if (!row) {
    throw new Error(`팔레트 단계 ${step} 을 tokens.md 1절에서 찾지 못했다.`);
  }

  return row.cells[PALETTE_HEX_COLUMN[theme]];
}

function reportedRatioOf(cell: string, comboText: string): number {
  const ratio = Number(cell);
  if (!Number.isFinite(ratio)) {
    throw new Error(`${comboText} 의 대비값을 숫자로 읽지 못했다: ${cell}`);
  }
  return ratio;
}

// 재계산값은 반올림하지 않는다. 표의 둘째 자리와 맞추는 일은 테스트의 toBeCloseTo(…, 2)가 이미 하고, 4.5 판정은 4.5065처럼 경계에 붙은 줄을 표기값이 아니라 실제값으로 갈라야 한다.
function recomputedRatio(markdown: string, combo: Combo, theme: Theme): number {
  return contrastRatio(
    resolveTokenHex(markdown, combo.left, theme),
    resolveTokenHex(markdown, combo.right, theme),
  );
}

export function measuredContrastRows(markdown: string): MeasuredContrastRow[] {
  return requireRows(markdown, MEASURED_HEADER, "측정한 조합").map((row) => {
    const cell = row.cells[COMBO_COLUMN];
    const combo = parseComboCell(cell);

    return {
      combo,
      reported: {
        light: reportedRatioOf(row.cells[MEASURED_RATIO_COLUMN.light], cell),
        dark: reportedRatioOf(row.cells[MEASURED_RATIO_COLUMN.dark], cell),
      },
      recomputed: {
        light: recomputedRatio(markdown, combo, "light"),
        dark: recomputedRatio(markdown, combo, "dark"),
      },
    };
  });
}

export function droppedContrastRows(markdown: string): DroppedContrastRow[] {
  return requireRows(markdown, DROPPED_HEADER, "떨어진 조합").map((row) => {
    const cell = row.cells[COMBO_COLUMN];
    const combo = parseDroppedComboCell(cell);

    return {
      combo,
      reported: reportedRatioOf(row.cells[DROPPED_RATIO_COLUMN], cell),
      recomputed: recomputedRatio(markdown, combo, combo.theme),
    };
  });
}
