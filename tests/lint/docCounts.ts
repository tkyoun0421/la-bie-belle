const TENS: Record<string, number> = {
  열: 10,
  스물: 20,
  서른: 30,
  마흔: 40,
  쉰: 50,
};

const UNITS: Record<string, number> = {
  하나: 1,
  둘: 2,
  셋: 3,
  넷: 4,
  다섯: 5,
  여섯: 6,
  일곱: 7,
  여덟: 8,
  아홉: 9,
};

const TENS_PATTERN = Object.keys(TENS).join("|");
const UNITS_PATTERN = Object.keys(UNITS).join("|");

const NUMBER_WORD = new RegExp(`^(${TENS_PATTERN})?(${UNITS_PATTERN})?$`);

const STATED_CHECKS = new RegExp(
  `검사 ((?:${TENS_PATTERN})?(?:${UNITS_PATTERN})?)(?=[을를이가은는과와의에도만으로\\s.,)]|$)`,
  "g",
);

const ENFORCEMENT_HEADING = "## 집행";

const TABLE_HEAD_ROWS = 2;

export function koreanNumber(word: string): number | null {
  const match = NUMBER_WORD.exec(word);

  if (!match || word === "") {
    return null;
  }

  const [, tens, units] = match;

  return (tens ? TENS[tens] : 0) + (units ? UNITS[units] : 0);
}

export function statedCheckCount(text: string): number | null {
  for (const [, word] of text.matchAll(STATED_CHECKS)) {
    const count = koreanNumber(word);

    if (count !== null) {
      return count;
    }
  }

  return null;
}

function enforcementSection(markdown: string): string[] {
  const lines = markdown.split("\n");
  const start = lines.indexOf(ENFORCEMENT_HEADING);

  if (start === -1) {
    return [];
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));

  return end === -1 ? rest : rest.slice(0, end);
}

export function enforcementRowCount(markdown: string): number {
  const section = enforcementSection(markdown);
  const first = section.findIndex((line) => line.startsWith("|"));

  if (first === -1) {
    return 0;
  }

  const rest = section.slice(first);
  const after = rest.findIndex((line) => !line.startsWith("|"));
  const table = after === -1 ? rest : rest.slice(0, after);

  return Math.max(table.length - TABLE_HEAD_ROWS, 0);
}
