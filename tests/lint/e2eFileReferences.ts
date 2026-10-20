import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type E2eFileViolation = {
  file: string;
  key: FileReadingKey;
  reference: string;
};

const E2E_DIR = "tests/e2e";

const FILE_READING_KEYS = ["runScript", "runFlow"] as const;

type FileReadingKey = (typeof FILE_READING_KEYS)[number];

const KEY_LINE = new RegExp(
  `^(\\s*(?:-\\s+)?)(${FILE_READING_KEYS.join("|")}):(.*)$`,
);

const FILE_LINE = /^\s*file:(.*)$/;

type OpenBlock = { key: FileReadingKey; column: number };

function isFileReadingKey(value: string): value is FileReadingKey {
  return FILE_READING_KEYS.some((key) => key === value);
}

function scalar(raw: string): string {
  const value = raw.replace(/\s+#.*$/, "").trim();
  const quoted = /^(["'])(.*)\1$/.exec(value);

  return quoted ? quoted[2] : value;
}

function isLiteralPath(value: string): boolean {
  return value !== "" && !value.includes("${") && !/^[{[|>]/.test(value);
}

function columnOf(line: string): number {
  return line.length - line.trimStart().length;
}

function isContent(line: string): boolean {
  const trimmed = line.trim();

  return trimmed !== "" && !trimmed.startsWith("#");
}

function e2eFileReferences(
  source: string,
): { key: FileReadingKey; reference: string }[] {
  const references: { key: FileReadingKey; reference: string }[] = [];
  let open: OpenBlock | null = null;

  for (const line of source.split("\n")) {
    if (!isContent(line)) {
      continue;
    }

    if (open && columnOf(line) <= open.column) {
      open = null;
    }

    const keyMatch = KEY_LINE.exec(line);

    if (keyMatch && isFileReadingKey(keyMatch[2])) {
      const key = keyMatch[2];
      const value = scalar(keyMatch[3]);

      if (value === "") {
        open = { key, column: keyMatch[1].length };
      } else if (isLiteralPath(value)) {
        references.push({ key, reference: value });
      }

      continue;
    }

    const fileMatch = open ? FILE_LINE.exec(line) : null;

    if (open && fileMatch) {
      const value = scalar(fileMatch[1]);

      if (isLiteralPath(value)) {
        references.push({ key: open.key, reference: value });
      }
    }
  }

  return references;
}

export function e2eFileViolations(
  file: string,
  source: string,
  root: string = process.cwd(),
): E2eFileViolation[] {
  const dir = path.dirname(path.resolve(root, file));

  return e2eFileReferences(source)
    .filter(({ reference }) => !existsSync(path.resolve(dir, reference)))
    .map(({ key, reference }) => ({ file, key, reference }));
}

function flowFiles(root: string, relative: string): string[] {
  return readdirSync(path.join(root, relative), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const next = path.join(relative, entry.name);

    if (entry.isDirectory()) {
      return flowFiles(root, next);
    }

    return /\.ya?ml$/.test(next) ? [next] : [];
  });
}

export function repositoryE2eFileViolations(
  root: string = process.cwd(),
): E2eFileViolation[] {
  return flowFiles(root, E2E_DIR).flatMap((file) =>
    e2eFileViolations(file, readFileSync(path.join(root, file), "utf8"), root),
  );
}
