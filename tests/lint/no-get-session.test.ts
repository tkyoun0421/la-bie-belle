import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.join(process.cwd(), "src");

const GET_SESSION_CALL = /\.getSession\s*\(/;
const USE_CLIENT_DIRECTIVE = /^\s*["']use client["'];?/;

const SESSION_SERVER_FILES = [
  "src/middleware.ts",
  "src/shared/lib/get-current-user.ts",
  "src/shared/lib/create-supabase-server-client.ts",
];

function tsFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "__tests__") {
      return [];
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return tsFilesUnder(fullPath);
    }

    return /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  });
}

function isServerFile(content: string) {
  return !USE_CLIENT_DIRECTIVE.test(content);
}

describe("서버 코드는 getSession()을 쓰지 않는다", () => {
  it.each(SESSION_SERVER_FILES)(
    "%s 가 세션을 다루는 자리로 존재한다",
    (relativePath) => {
      expect(existsSync(path.join(process.cwd(), relativePath))).toBe(true);
    },
  );

  it("src/ 아래 서버 코드 어디에서도 getSession()을 호출하지 않는다", () => {
    const offenders = tsFilesUnder(SRC_ROOT)
      .map((filePath) => ({
        filePath,
        content: readFileSync(filePath, "utf8"),
      }))
      .filter(({ content }) => isServerFile(content))
      .filter(({ content }) => GET_SESSION_CALL.test(content))
      .map(({ filePath }) => path.relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
