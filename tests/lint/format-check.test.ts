import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const scratchDir = path.join(process.cwd(), "tests/lint/.tmp-format-check");
const prettierBin = path.join(process.cwd(), "node_modules/.bin/prettier");

function runPrettier(args: string[]) {
  const result = spawnSync(prettierBin, args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function writeFixture(name: string, code: string) {
  const filePath = path.join(scratchDir, `${randomUUID()}-${name}`);
  fs.writeFileSync(filePath, code, "utf8");
  return filePath;
}

beforeAll(() => {
  fs.mkdirSync(scratchDir, { recursive: true });
});

afterAll(() => {
  fs.rmSync(scratchDir, { recursive: true, force: true });
});

describe("규칙12 — Tailwind 클래스 순서", () => {
  it("뒤섞인 클래스만 format check에 걸리고, 도구가 --write로 낸 결과는 통과한다", () => {
    const scrambled = `export function Fixture() {\n  return <div className="p-4 flex items-center rounded-lg" />;\n}\n`;

    const scrambledPath = writeFixture("scrambled.tsx", scrambled);
    const answerPath = writeFixture("answer.tsx", scrambled);

    const write = runPrettier(["--write", answerPath]);
    expect(write.status).toBe(0);

    const checkAnswer = runPrettier(["--check", answerPath]);
    expect(checkAnswer.status).toBe(0);

    const checkScrambled = runPrettier(["--check", scrambledPath]);
    expect(checkScrambled.status).not.toBe(0);
  });

  it("커스텀 role 토큰 유틸이 섞여도 반복 포맷한 결과가 같다", () => {
    const code = `export function Fixture() {\n  return <div className="flex bg-bg-neutral items-center p-4 rounded-lg" />;\n}\n`;
    const filePath = writeFixture("idempotent.tsx", code);

    const firstWrite = runPrettier(["--write", filePath]);
    expect(firstWrite.status).toBe(0);
    const firstResult = fs.readFileSync(filePath, "utf8");

    const secondWrite = runPrettier(["--write", filePath]);
    expect(secondWrite.status).toBe(0);
    const secondResult = fs.readFileSync(filePath, "utf8");

    expect(secondResult).toBe(firstResult);
  });

  it("우리 역할 토큰 유틸이 표준 유틸과 섞여도 맨 앞으로 밀리지 않는다", () => {
    const code = `export function Fixture() {\n  return <div className="rounded-lg items-center bg-bg-neutral flex p-4" />;\n}\n`;
    const filePath = writeFixture("theme-fallback.tsx", code);

    const write = runPrettier(["--write", filePath]);
    expect(write.status).toBe(0);

    const formatted = fs.readFileSync(filePath, "utf8");
    const match = formatted.match(/className="([^"]+)"/);
    expect(match).not.toBeNull();

    const classes = (match?.[1] ?? "").split(/\s+/).filter(Boolean);

    expect(classes[0]).not.toBe("bg-bg-neutral");
  });
});
