import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { Violation } from "./violation.ts";

export const STATIC_CHUNK_DIRECTORY = ".next/static/chunks";

export const BUNDLE_BUDGET_BYTES = 420 * 1024;

export type BundleMeasurement = {
  readonly totalBytes: number;
  readonly largestBytes: number;
  readonly chunkCount: number;
};

const EMPTY_MEASUREMENT: BundleMeasurement = { totalBytes: 0, largestBytes: 0, chunkCount: 0 };

function toKilobytes(bytes: number): string {
  return `${Math.round(bytes / 1024)}KB`;
}

export function measureStaticChunks(root: string): BundleMeasurement {
  const directory = join(root, STATIC_CHUNK_DIRECTORY);

  if (!existsSync(directory)) {
    return EMPTY_MEASUREMENT;
  }

  let totalBytes = 0;
  let largestBytes = 0;
  let chunkCount = 0;

  for (const path of listChunkFiles(directory)) {
    const size = gzipSync(readFileSync(path)).length;
    totalBytes += size;
    largestBytes = Math.max(largestBytes, size);
    chunkCount += 1;
  }

  return { totalBytes, largestBytes, chunkCount };
}

function listChunkFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listChunkFiles(path);
    }
    return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
  });
}

export function evaluateBundleBudget(
  measurement: BundleMeasurement,
  limitBytes: number,
): Violation[] {
  if (measurement.chunkCount === 0) {
    return [
      {
        gate: "gate:bundle",
        file: STATIC_CHUNK_DIRECTORY,
        message: "빌드 산출물에서 정적 청크를 찾지 못해 번들 상한을 검사할 수 없습니다.",
        hint: "pnpm build를 먼저 실행하세요.",
      },
    ];
  }

  if (measurement.totalBytes <= limitBytes) {
    return [];
  }

  return [
    {
      gate: "gate:bundle",
      file: STATIC_CHUNK_DIRECTORY,
      message: `정적 청크 gzip 합계가 ${toKilobytes(measurement.totalBytes)}(${measurement.totalBytes}바이트)로 상한 ${toKilobytes(limitBytes)}(${limitBytes}바이트)를 넘었습니다.`,
      hint: `청크 ${measurement.chunkCount}개, 최대 청크 ${toKilobytes(measurement.largestBytes)}. 의존성을 줄이거나 상한 변경 승인을 받으세요.`,
    },
  ];
}

export function runBundleBudgetGate(root: string): Violation[] {
  return evaluateBundleBudget(measureStaticChunks(root), BUNDLE_BUDGET_BYTES);
}
