import path from "node:path";
import { type CodeFile, repositoryCodeFiles } from "@tests/lint/fileNaming";

export const MAPPER_SUFFIX = ".mapper.ts";

const PAIR_DIRECTORY = "__tests__";

const TEST_SUFFIX = ".test.ts";

const SOURCE_ROOT = "src/";

const EXECUTABLE_EXPORT =
  /^\s*export\s+(?:async\s+)?(?:function|class)\s+(\w+)|^\s*export\s+(?:const|let)\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*(?::[^=]*)?=>|^\s*export\s+(?:const|let)\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s+)?function\b/gm;

export type MapperPairViolation =
  | { type: "missing-test"; file: string; expected: string }
  | { type: "uncalled-export"; file: string; expected: string; name: string };

export function pairTestOf(file: string): string {
  const directory = path.posix.dirname(file);
  const base = path.posix.basename(file, ".ts");

  return path.posix.join(directory, PAIR_DIRECTORY, `${base}${TEST_SUFFIX}`);
}

export function executableExportsOf(source: string): string[] {
  return [...source.matchAll(EXECUTABLE_EXPORT)].map(
    ([, declared, arrow, assigned]) =>
      (declared ?? arrow ?? assigned) as string,
  );
}

function specifierOf(file: string): string {
  return `@/${file.slice(SOURCE_ROOT.length, -".ts".length)}`;
}

function isMapper({ file }: CodeFile): boolean {
  return file.endsWith(MAPPER_SUFFIX);
}

function testsPulling(file: string, files: readonly CodeFile[]): CodeFile[] {
  const folder = path.posix.join(path.posix.dirname(file), PAIR_DIRECTORY);
  const quoted = `"${specifierOf(file)}"`;

  return files.filter(
    (candidate) =>
      candidate.file.endsWith(TEST_SUFFIX) &&
      path.posix.dirname(candidate.file) === folder &&
      candidate.source.includes(quoted),
  );
}

export function mapperPairViolations(
  files: readonly CodeFile[],
): MapperPairViolation[] {
  return files
    .filter(isMapper)
    .flatMap(({ file, source }): MapperPairViolation[] => {
      const expected = pairTestOf(file);
      const pulling = testsPulling(file, files);

      if (pulling.length === 0) {
        return [{ type: "missing-test", file, expected }];
      }

      const written = pulling.map((one) => one.source).join("\n");

      return executableExportsOf(source)
        .filter((name) => !new RegExp(`\\b${name}\\b`).test(written))
        .map((name) => ({
          type: "uncalled-export" as const,
          file,
          expected,
          name,
        }));
    });
}

export function describeMapperPairViolation(
  violation: MapperPairViolation,
): string {
  if (violation.type === "missing-test") {
    return `${violation.file}를 당기는 테스트가 옆 ${PAIR_DIRECTORY}에 없다 — ${violation.expected}에 필드마다의 단언을 써라.`;
  }

  return `${violation.file}가 내보내는 ${violation.name}를 옆 ${PAIR_DIRECTORY}의 어느 테스트도 부르지 않는다 — ${violation.expected}에 그 이름을 부르는 단언을 더해라.`;
}

export function repositoryMapperFiles(
  root: string = process.cwd(),
): CodeFile[] {
  return repositoryCodeFiles(root).filter(isMapper);
}

export function repositoryMapperPairViolations(
  root: string = process.cwd(),
): MapperPairViolation[] {
  return mapperPairViolations(repositoryCodeFiles(root));
}
