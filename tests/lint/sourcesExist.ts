import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { anchorsOf } from "@tests/lint/docLinks";
import { frontmatterSources, sourceDocFiles } from "@tests/lint/specDocs";

export type SourcesViolation = {
  file: string;
  source: string;
  kind: "missing-file" | "missing-anchor";
};

export function sourcesViolations(
  file: string,
  markdown: string,
  root: string = process.cwd(),
): SourcesViolation[] {
  const dir = path.dirname(path.resolve(root, file));

  return frontmatterSources(markdown).flatMap((source): SourcesViolation[] => {
    const hash = source.indexOf("#");
    const target = hash === -1 ? source : source.slice(0, hash);
    const anchor = hash === -1 ? "" : source.slice(hash + 1);
    const absolute = path.resolve(dir, target);

    if (!existsSync(absolute)) {
      return [{ file, source, kind: "missing-file" }];
    }

    if (anchor === "" || !absolute.endsWith(".md")) {
      return [];
    }

    return anchorsOf(readFileSync(absolute, "utf8")).has(anchor.toLowerCase())
      ? []
      : [{ file, source, kind: "missing-anchor" }];
  });
}

export function allSourcesViolations(
  root: string = process.cwd(),
): SourcesViolation[] {
  return sourceDocFiles(root).flatMap((file) =>
    sourcesViolations(file, readFileSync(path.join(root, file), "utf8"), root),
  );
}
