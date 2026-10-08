import path from "node:path";

export type ImpactDoc = {
  file: string;
  tracked: boolean;
  sources: string[];
};

export type ImpactViolation = {
  document: string;
  kind: "missing-section" | "missing-document";
};

const IMPACT_SECTION = "영향 확인";
const HEADING = /^(#{1,6})\s+(.*?)\s*$/;

function target(file: string, source: string): string {
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(file), source.split("#")[0]),
  );
}

export function findImpacted(
  changedFiles: string[],
  docs: ImpactDoc[],
): string[] {
  const changed = new Set(changedFiles);

  return docs
    .filter((doc) => doc.tracked)
    .filter((doc) =>
      doc.sources.some((source) => changed.has(target(doc.file, source))),
    )
    .map((doc) => doc.file);
}

function impactSection(prBody: string): string | null {
  const lines = prBody.split("\n");
  const start = lines.findIndex((line) => {
    const heading = HEADING.exec(line);
    return heading !== null && heading[2] === IMPACT_SECTION;
  });

  if (start === -1) {
    return null;
  }

  const level = (HEADING.exec(lines[start]) as RegExpExecArray)[1].length;
  const end = lines.findIndex((line, index) => {
    const heading = HEADING.exec(line);
    return index > start && heading !== null && heading[1].length <= level;
  });

  return lines.slice(start + 1, end === -1 ? lines.length : end).join("\n");
}

export function checkImpactSection(
  prBody: string,
  impacted: string[],
): ImpactViolation[] {
  if (impacted.length === 0) {
    return [];
  }

  const section = impactSection(prBody);

  if (section === null) {
    return impacted.map((document) => ({
      document,
      kind: "missing-section" as const,
    }));
  }

  return impacted
    .filter((document) => !section.includes(path.posix.basename(document)))
    .map((document) => ({ document, kind: "missing-document" as const }));
}
