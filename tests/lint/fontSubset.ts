export const SUBSET_DIR = "assets/fonts/subset";

export const SUBSET_FONTS = [
  "WantedSans-Regular.ttf",
  "WantedSans-Medium.ttf",
  "WantedSans-SemiBold.ttf",
  "WantedSans-Bold.ttf",
];

const KS_LEAD = { first: 0xb0, last: 0xc8 };
const KS_TRAIL = { first: 0xa1, last: 0xfe };

const HANGUL_SYLLABLE = { first: 0xac00, last: 0xd7a3 };

const JAMO = { first: 0x3131, last: 0x3163 };

const PRINTABLE_ASCII = { first: 0x20, last: 0x7e };

const SYMBOLS = [
  "·",
  "×",
  "–",
  "—",
  "…",
  "←",
  "↑",
  "→",
  "≈",
  "①",
  "②",
  "③",
  "④",
  "⑤",
  "⑥",
  "⑦",
  "「",
  "」",
  "₩",
  "°",
  "±",
  "‘",
  "’",
  "“",
  "”",
  "•",
  "※",
  "✓",
  "✗",
  "«",
  "»",
];

function range({ first, last }: { first: number; last: number }): number[] {
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export function koreanCommonSyllables(): string[] {
  const decoder = new TextDecoder("euc-kr");
  const syllables: string[] = [];

  for (const lead of range(KS_LEAD)) {
    for (const trail of range(KS_TRAIL)) {
      const decoded = decoder.decode(new Uint8Array([lead, trail]));
      const code = decoded.codePointAt(0);

      if (
        decoded.length === 1 &&
        code !== undefined &&
        code >= HANGUL_SYLLABLE.first &&
        code <= HANGUL_SYLLABLE.last
      ) {
        syllables.push(decoded);
      }
    }
  }

  return syllables;
}

export function requiredCodepoints(): Set<number> {
  const codepoints = new Set<number>(range(PRINTABLE_ASCII));

  for (const code of range(JAMO)) {
    codepoints.add(code);
  }

  for (const syllable of koreanCommonSyllables()) {
    codepoints.add(syllable.codePointAt(0) as number);
  }

  for (const symbol of SYMBOLS) {
    codepoints.add(symbol.codePointAt(0) as number);
  }

  return codepoints;
}

export function unicodesFile(
  codepoints: Set<number> = requiredCodepoints(),
): string {
  return `${[...codepoints]
    .sort((a, b) => a - b)
    .map((code) => `U+${code.toString(16).toUpperCase().padStart(4, "0")}`)
    .join("\n")}\n`;
}

const CMAP_TAG = 0x636d6170;

function tableOffset(font: DataView, tag: number): number | null {
  const tables = font.getUint16(4);

  for (let index = 0; index < tables; index += 1) {
    const record = 12 + index * 16;

    if (font.getUint32(record) === tag) {
      return font.getUint32(record + 8);
    }
  }

  return null;
}

function readFormat4(font: DataView, offset: number, into: Set<number>) {
  const segments = font.getUint16(offset + 6) / 2;
  const ends = offset + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const rangeOffsets = deltas + segments * 2;

  for (let segment = 0; segment < segments; segment += 1) {
    const end = font.getUint16(ends + segment * 2);
    const start = font.getUint16(starts + segment * 2);

    if (start > end || start === 0xffff) {
      continue;
    }

    const delta = font.getInt16(deltas + segment * 2);
    const rangeOffsetAt = rangeOffsets + segment * 2;
    const rangeOffset = font.getUint16(rangeOffsetAt);

    for (let code = start; code <= end; code += 1) {
      const glyph =
        rangeOffset === 0
          ? (code + delta) & 0xffff
          : font.getUint16(rangeOffsetAt + rangeOffset + (code - start) * 2);

      if (glyph !== 0) {
        into.add(code);
      }
    }
  }
}

function readFormat6(font: DataView, offset: number, into: Set<number>) {
  const first = font.getUint16(offset + 6);
  const count = font.getUint16(offset + 8);

  for (let index = 0; index < count; index += 1) {
    if (font.getUint16(offset + 10 + index * 2) !== 0) {
      into.add(first + index);
    }
  }
}

function readFormat12(font: DataView, offset: number, into: Set<number>) {
  const groups = font.getUint32(offset + 12);

  for (let group = 0; group < groups; group += 1) {
    const record = offset + 16 + group * 12;
    const start = font.getUint32(record);
    const end = font.getUint32(record + 4);

    for (let code = start; code <= end; code += 1) {
      into.add(code);
    }
  }
}

export function fontCodepoints(buffer: ArrayBuffer): Set<number> {
  const font = new DataView(buffer);
  const cmap = tableOffset(font, CMAP_TAG);
  const codepoints = new Set<number>();

  if (cmap === null) {
    return codepoints;
  }

  const subtables = font.getUint16(cmap + 2);

  for (let index = 0; index < subtables; index += 1) {
    const record = cmap + 4 + index * 8;
    const offset = cmap + font.getUint32(record + 4);
    const format = font.getUint16(offset);

    if (format === 4) {
      readFormat4(font, offset, codepoints);
    } else if (format === 6) {
      readFormat6(font, offset, codepoints);
    } else if (format === 12) {
      readFormat12(font, offset, codepoints);
    }
  }

  return codepoints;
}

export function missingCodepoints(buffer: ArrayBuffer): number[] {
  const present = fontCodepoints(buffer);

  return [...requiredCodepoints()]
    .filter((code) => !present.has(code))
    .sort((a, b) => a - b);
}
