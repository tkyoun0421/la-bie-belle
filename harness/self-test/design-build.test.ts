import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../lib/repo.ts";

const BUILD_SCRIPT = "harness/design/build.ts";

type BuildRunResult = {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
};

function runDesignBuild(args: readonly string[]): BuildRunResult {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", BUILD_SCRIPT, ...args],
    { cwd: resolveRepoRoot(), encoding: "utf8", timeout: 60_000 },
  );
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function createScratchDirectory(): string {
  return mkdtempSync(join(tmpdir(), "lbb-design-build-"));
}

function writeInputHtml(directory: string, fileName: string, body: string): string {
  const path = join(directory, fileName);
  writeFileSync(
    path,
    [
      "<!doctype html>",
      '<html lang="ko">',
      "<head><meta charset=\"utf-8\" /></head>",
      "<body>",
      body,
      "</body>",
      "</html>",
      "",
    ].join("\n"),
  );
  return path;
}

test("design:build(5) — 최소 HTML이 쓴 클래스 규칙이 <style>로 인라인된다", () => {
  const directory = createScratchDirectory();
  const inputPath = writeInputHtml(directory, "sample.html", '<div class="flex items-center">시안</div>');

  const result = runDesignBuild([inputPath]);

  assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(join(directory, "sample.inlined.html"), "utf8");
  assert.match(output, /<style>[\s\S]*<\/style>/u);
  assert.match(output, /\.flex\s*\{[^}]*display:\s*flex/u);
});

test("design:build(5) — 산출물에 외부 <link>·<script src>·원격 URL이 없다", () => {
  const directory = createScratchDirectory();
  const inputPath = writeInputHtml(directory, "clean.html", '<p class="text-action">안내 문구</p>');

  const result = runDesignBuild([inputPath]);

  assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(join(directory, "clean.inlined.html"), "utf8");
  assert.doesNotMatch(output, /<link[^>]*rel=["']?stylesheet/iu);
  assert.doesNotMatch(output, /<script[^>]*\ssrc=/iu);
  assert.doesNotMatch(output, /https?:\/\//u);
});

test("design:build(5) — 글꼴을 base64 data: URI로 심되 프레임이 셋이어도 @font-face는 하나다", () => {
  const directory = createScratchDirectory();
  const inputPath = writeInputHtml(
    directory,
    "frames.html",
    [
      '<section class="frame"><h1 class="typo-headline-lg">화면 1</h1></section>',
      '<section class="frame"><h1 class="typo-headline-lg">화면 2</h1></section>',
      '<section class="frame"><h1 class="typo-headline-lg">화면 3</h1></section>',
    ].join("\n"),
  );

  const result = runDesignBuild([inputPath]);

  assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(join(directory, "frames.inlined.html"), "utf8");
  const fontFaceMatches = output.match(/@font-face/gu) ?? [];
  assert.equal(fontFaceMatches.length, 1);
  assert.match(output, /@font-face\s*\{[^}]*src:\s*url\("?data:font\/woff2;base64,/su);
});

function extractFontFaceFamily(css: string): string | null {
  const match = /@font-face\s*\{[^}]*font-family:\s*"([^"]+)"/su.exec(css);
  return match?.[1] ?? null;
}

function stripFontFaceBlocks(css: string): string {
  return css.replace(/@font-face\s*\{[^}]*\}/gsu, "");
}

function findUndeclaredVarReferences(css: string): string[] {
  const declared = new Set<string>();
  const declarationPattern = /(--[a-zA-Z0-9-]+):/gu;
  for (const match of css.matchAll(declarationPattern)) {
    const name = match[1];
    if (name !== undefined) {
      declared.add(name);
    }
  }

  const undeclared = new Set<string>();
  const referencePattern = /var\((--[a-zA-Z0-9-]+)\)/gu;
  for (const match of css.matchAll(referencePattern)) {
    const name = match[1];
    if (name !== undefined && !declared.has(name)) {
      undeclared.add(name);
    }
  }
  return [...undeclared];
}

test("design:build(5) — @font-face가 등록한 글꼴 이름이 실제 font-family 체인에서 쓰인다", () => {
  const directory = createScratchDirectory();
  const inputPath = writeInputHtml(directory, "font-usage.html", '<p class="font-sans">본문</p>');

  const result = runDesignBuild([inputPath]);

  assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(join(directory, "font-usage.inlined.html"), "utf8");
  const registeredFamily = extractFontFaceFamily(output);
  assert.ok(registeredFamily !== null, "@font-face에 font-family 선언이 있어야 한다");
  assert.ok(
    stripFontFaceBlocks(output).includes(`"${registeredFamily}"`),
    `@font-face가 등록한 "${registeredFamily}"가 @font-face 밖의 font-family 체인에서 쓰이지 않는다`,
  );
});

test("design:build(5) — 산출물에 폴백 없이 남은 미정의 var() 참조가 없다", () => {
  const directory = createScratchDirectory();
  const inputPath = writeInputHtml(directory, "font-vars.html", '<p class="font-sans">본문</p>');

  const result = runDesignBuild([inputPath]);

  assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(join(directory, "font-vars.inlined.html"), "utf8");
  const undeclared = findUndeclaredVarReferences(output);
  assert.deepEqual(undeclared, [], `산출물 안에서 정의되지 않은 var() 참조가 폴백 없이 남아 있다: ${undeclared.join(", ")}`);
});

test("design:build(5) — 입력 인자가 없으면 exit 1이다", () => {
  const result = runDesignBuild([]);

  assert.equal(result.status, 1);
});

test("design:build(5) — 입력 파일이 존재하지 않으면 exit 1이다", () => {
  const directory = createScratchDirectory();

  const result = runDesignBuild([join(directory, "missing.html")]);

  assert.equal(result.status, 1);
});

test("design:build(5) — 입력 확장자가 .html이 아니면 exit 1이다", () => {
  const directory = createScratchDirectory();
  const wrongExtension = join(directory, "sample.txt");
  writeFileSync(wrongExtension, "<div>텍스트</div>");

  const result = runDesignBuild([wrongExtension]);

  assert.equal(result.status, 1);
});

test("design:build(5) — --out으로 출력 경로를 지정할 수 있다", () => {
  const directory = createScratchDirectory();
  const inputPath = writeInputHtml(directory, "custom.html", '<div class="p-4">본문</div>');
  const outputPath = join(directory, "custom-output.html");

  const result = runDesignBuild([inputPath, "--out", outputPath]);

  assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(outputPath, "utf8");
  assert.match(output, /<style>/u);
});

test("design:build(5) — --out을 생략하면 <이름>.inlined.html에 쓴다", () => {
  const directory = createScratchDirectory();
  writeInputHtml(directory, "default-out.html", '<div class="p-4">본문</div>');

  const result = runDesignBuild([join(directory, "default-out.html")]);

  assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(join(directory, "default-out.inlined.html"), "utf8");
  assert.match(output, /<style>/u);
});

test("design:build(5) — 같은 입력을 재실행하면 같은 산출물을 낸다", () => {
  const directory = createScratchDirectory();
  const inputPath = writeInputHtml(directory, "repeat.html", '<div class="rounded-lg p-6">반복</div>');

  const first = runDesignBuild([inputPath]);
  assert.equal(first.status, 0, first.stderr);
  const firstOutput = readFileSync(join(directory, "repeat.inlined.html"), "utf8");

  const second = runDesignBuild([inputPath]);
  assert.equal(second.status, 0, second.stderr);
  const secondOutput = readFileSync(join(directory, "repeat.inlined.html"), "utf8");

  assert.equal(firstOutput, secondOutput);
});
