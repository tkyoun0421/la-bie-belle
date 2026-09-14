import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { anchorsOf } from "@tests/lint/doc-links";
import { frontmatterSources, sourceDocFiles } from "@tests/lint/spec-docs";

export type SourcesViolation = {
  file: string;
  source: string;
  kind: "missing-file" | "missing-anchor";
};

/**
 * `sources` 한 줄이 가리키는 파일과 `#앵커`가 실존하는지 본다. 경로는 문서가 놓인
 * 자리 기준이라 `file`이 저장소 뿌리 기준이어야 한다. 규칙 ID 앵커(`#att-017`)도
 * 제목 슬러그라 같은 검사에 걸린다.
 */
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
