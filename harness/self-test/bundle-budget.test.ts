import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  STATIC_CHUNK_DIRECTORY,
  evaluateBundleBudget,
  measureStaticChunks,
  runBundleBudgetGate,
} from "../lib/bundle-budget.ts";
import { createFixtureRoot, joinMessages } from "./fixture.ts";

function fixtureWithChunks(sizes: readonly number[]): string {
  const root = createFixtureRoot();
  const directory = join(root, STATIC_CHUNK_DIRECTORY);
  mkdirSync(directory, { recursive: true });
  sizes.forEach((size, index) => {
    writeFileSync(join(directory, `chunk-${index}.js`), "a".repeat(size));
  });
  return root;
}

function gzippedSize(size: number): number {
  return gzipSync(Buffer.from("a".repeat(size))).length;
}

test("gate:bundle — 상한 이하면 통과한다", () => {
  const measurement = { totalBytes: 100, largestBytes: 60, chunkCount: 2 };

  assert.deepEqual(evaluateBundleBudget(measurement, 200), []);
});

test("gate:bundle — 상한과 같으면 통과한다", () => {
  const measurement = { totalBytes: 200, largestBytes: 200, chunkCount: 1 };

  assert.deepEqual(evaluateBundleBudget(measurement, 200), []);
});

test("gate:bundle — 상한을 1바이트만 넘어도 차단한다", () => {
  const measurement = { totalBytes: 201, largestBytes: 201, chunkCount: 1 };

  const violations = evaluateBundleBudget(measurement, 200);

  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.gate, "gate:bundle");
  assert.match(joinMessages(violations), /201/);
  assert.match(joinMessages(violations), /200/);
});

test("gate:bundle — 청크가 하나도 없으면 측정 실패로 차단한다", () => {
  const measurement = { totalBytes: 0, largestBytes: 0, chunkCount: 0 };

  const violations = evaluateBundleBudget(measurement, 200);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /빌드 산출물/);
});

test("측정 — .js 청크만 gzip 합계에 넣는다", () => {
  const root = fixtureWithChunks([500, 900]);
  writeFileSync(join(root, STATIC_CHUNK_DIRECTORY, "style.css"), "a".repeat(4000));

  const measurement = measureStaticChunks(root);

  assert.equal(measurement.chunkCount, 2);
  assert.equal(measurement.totalBytes, gzippedSize(500) + gzippedSize(900));
  assert.equal(measurement.largestBytes, gzippedSize(900));
});

test("측정 — 하위 디렉터리의 청크도 합계에 넣는다", () => {
  const root = fixtureWithChunks([500]);
  const nested = join(root, STATIC_CHUNK_DIRECTORY, "app", "protected");
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(nested, "page.js"), "a".repeat(900));

  const measurement = measureStaticChunks(root);

  assert.equal(measurement.chunkCount, 2);
  assert.equal(measurement.totalBytes, gzippedSize(500) + gzippedSize(900));
  assert.equal(measurement.largestBytes, gzippedSize(900));
});

test("측정 — 빌드 디렉터리가 없으면 0으로 보고한다", () => {
  const root = createFixtureRoot();

  assert.deepEqual(measureStaticChunks(root), {
    totalBytes: 0,
    largestBytes: 0,
    chunkCount: 0,
  });
});

test("gate:bundle — 빌드 디렉터리가 없으면 사유를 남기고 차단한다", () => {
  const root = createFixtureRoot();

  const violations = runBundleBudgetGate(root);

  assert.ok(violations.length > 0, "빌드 산출물 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /빌드 산출물/);
});
