import { readFileSync } from "node:fs";
import path from "node:path";

type TokenUnit = "duration" | "length" | "scale";

export type MotionPair = {
  tsExportName: string;
  tokenRow: string;
  unit: TokenUnit;
};

export const MOTION_PAIRS: MotionPair[] = [
  {
    tsExportName: "RISE_DURATION_MS",
    tokenRow: "`--duration-slower`",
    unit: "duration",
  },
  {
    tsExportName: "RISE_STAGGER_MS",
    tokenRow: "`--stagger-step`",
    unit: "duration",
  },
  {
    tsExportName: "RISE_DISTANCE",
    tokenRow: "`--rise-distance`",
    unit: "length",
  },
  {
    tsExportName: "PRESS_DURATION_MS",
    tokenRow: "`--duration-fast`",
    unit: "duration",
  },
  { tsExportName: "PRESS_SCALE", tokenRow: "버튼 눌림", unit: "scale" },
];

export type MotionTokenViolation =
  | {
      tsExportName: string;
      kind: "mismatch";
      expected: number;
      actual: number;
    }
  | {
      tsExportName: string;
      kind: "missing-from-constants" | "missing-from-tokens";
    };

const CONSTANTS_FILE = "src/shared/consts/motion.const.ts";
const TOKENS_FILE = "docs/2-design/design-system/tokens.md";

const MS_PER_SECOND = 1000;

const NUMBER = String.raw`(\d*\.?\d+)`;

const TOKEN_VALUE: Record<TokenUnit, RegExp> = {
  duration: new RegExp(`^${NUMBER}(ms|s)$`),
  length: new RegExp(`^${NUMBER}px$`),
  scale: new RegExp(`^\`scale\\(${NUMBER}\\)\`$`),
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function constantValue(source: string, exportName: string): number | null {
  const match = source.match(
    new RegExp(`export const ${exportName}\\s*(?::[^=]+)?=\\s*${NUMBER}\\s*;`),
  );

  return match ? Number(match[1]) : null;
}

function tokenCell(markdown: string, tokenRow: string): string | null {
  const row = markdown.match(
    new RegExp(`^\\|\\s*${escapeRegExp(tokenRow)}\\s*\\|([^|]*)\\|`, "m"),
  );

  return row ? row[1].trim() : null;
}

function tokenValue(markdown: string, pair: MotionPair): number | null {
  const cell = tokenCell(markdown, pair.tokenRow);
  const match = cell === null ? null : cell.match(TOKEN_VALUE[pair.unit]);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  return match[2] === "s" ? Number((value * MS_PER_SECOND).toFixed(3)) : value;
}

export function motionTokenViolations(
  constantsSource: string | null,
  tokensMd: string,
): MotionTokenViolation[] {
  return MOTION_PAIRS.flatMap((pair): MotionTokenViolation[] => {
    const actual =
      constantsSource === null
        ? null
        : constantValue(constantsSource, pair.tsExportName);

    if (actual === null) {
      return [
        { tsExportName: pair.tsExportName, kind: "missing-from-constants" },
      ];
    }

    const expected = tokenValue(tokensMd, pair);

    if (expected === null) {
      return [{ tsExportName: pair.tsExportName, kind: "missing-from-tokens" }];
    }

    return expected === actual
      ? []
      : [
          {
            tsExportName: pair.tsExportName,
            kind: "mismatch",
            expected,
            actual,
          },
        ];
  });
}

function readOrNull(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

export function repositoryMotionTokenViolations(
  root: string = process.cwd(),
): MotionTokenViolation[] {
  return motionTokenViolations(
    readOrNull(path.join(root, CONSTANTS_FILE)),
    readOrNull(path.join(root, TOKENS_FILE)) ?? "",
  );
}
