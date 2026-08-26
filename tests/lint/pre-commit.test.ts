import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const hook = path.join(process.cwd(), ".githooks/pre-commit");

const blocked = 1;
const allowed = 0;

const longSecret = "A".repeat(24);
const fakeOpenAiKey = ["sk", "-", "B".repeat(24)].join("");
const fakeAwsKey = ["AKIA", "C".repeat(16)].join("");

let repo: string;

function git(...args: string[]) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} 실패: ${result.stderr}`);
  }
}

function stage(name: string, body: string) {
  const file = path.join(repo, name);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, body, "utf8");
  git("add", "--force", name);
}

function runHook() {
  return spawnSync("sh", [hook], { cwd: repo, encoding: "utf8" }).status;
}

function reset() {
  git("rm", "-r", "--cached", "--ignore-unmatch", "--quiet", ".");
}

beforeAll(() => {
  repo = mkdtempSync(path.join(tmpdir(), "pre-commit-"));
  git("init", "--quiet");
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe("규칙17 — 시크릿과 .env", () => {
  it("평범한 소스 파일만 staged면 통과시킨다", () => {
    reset();
    stage("src/shared/lib/utils.ts", "export const answer = 42;\n");

    expect(runHook()).toBe(allowed);
  });

  it(".env가 staged면 막는다", () => {
    reset();
    stage(".env", "SUPABASE_URL=http://localhost\n");

    expect(runHook()).toBe(blocked);
  });

  it(".env.local처럼 접미사가 붙어도 막는다", () => {
    reset();
    stage(".env.local", "SUPABASE_URL=http://localhost\n");

    expect(runHook()).toBe(blocked);
  });

  it(".env.example은 통과시킨다", () => {
    reset();
    stage(".env.example", "SUPABASE_URL=\n");

    expect(runHook()).toBe(allowed);
  });

  it("키=값 모양의 시크릿이 staged diff에 있으면 막는다", () => {
    reset();
    stage("src/shared/config/env.ts", `const apiKey = "${longSecret}";\n`);

    expect(runHook()).toBe(blocked);
  });

  it("password와 token도 같은 그물에 걸린다", () => {
    reset();
    stage("src/shared/config/env.ts", `const password = "${longSecret}";\n`);
    expect(runHook()).toBe(blocked);

    reset();
    stage("src/shared/config/env.ts", `const token = "${longSecret}";\n`);
    expect(runHook()).toBe(blocked);
  });

  it("실키 형태의 문자열은 이름이 무해해도 막는다", () => {
    reset();
    stage("docs/scratch.md", `참고: ${fakeOpenAiKey}\n`);
    expect(runHook()).toBe(blocked);

    reset();
    stage("docs/scratch.md", `참고: ${fakeAwsKey}\n`);
    expect(runHook()).toBe(blocked);
  });

  it("짧은 값은 시크릿으로 세지 않는다", () => {
    reset();
    stage("src/shared/config/env.ts", `const apiKey = "short";\n`);

    expect(runHook()).toBe(allowed);
  });
});
